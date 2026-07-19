'use client'

import { useSyncExternalStore } from 'react'

/**
 * Single-player store for narrated recap clips.
 *
 * One module-level `<audio>` element is shared by every card, so starting a clip
 * inherently stops the previous one — the "only one plays at a time" rule needs
 * no coordination between components.
 *
 * Constraints from the backend handoff (`.claude/plans/recap-audio-playback.md`):
 * - The clip URL is a signed GCS URL that expires 6h after the API minted it, so
 *   it is never persisted — a stale URL surfaces as `errored` and the caller
 *   refetches the recap to get a fresh one.
 * - The bucket serves no CORS headers. The element's `crossOrigin` is left unset
 *   and the bytes are never `fetch`ed, which is what keeps playback working.
 *   (Setting `crossOrigin`, or piping this element into the Web Audio API, would
 *   trigger a preflight and fail at runtime only — nothing catches it at build time.)
 */

export type RecapAudioTrack = {
  /**
   * Stable id, namespaced by the surface rendering the control —
   * `brief:market:US:257`, `home:ticker:NVDA:412`. Two surfaces showing the same
   * recap deliberately get different ids so that closing one does not stop a clip
   * the other is still displaying (see `registerControl`).
   */
  id: string
  url: string
  /** Shown in the OS media notification / lock screen. */
  title: string
  /** Exact length from `duration_s` — used for layout before metadata loads. */
  duration: number
}

export type RecapAudioState = {
  /** Id of the loaded track; null when nothing has been played yet. */
  trackId: string | null
  isPlaying: boolean
  currentTime: number
  /** Length of the loaded track, seeded from `duration_s`. */
  duration: number
  rate: number
  /** True when the last load failed — usually an expired signed URL. */
  errored: boolean
}

export const PLAYBACK_RATES = [1, 1.25, 1.5, 2] as const

const INITIAL_STATE: RecapAudioState = {
  trackId: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  rate: 1,
  errored: false,
}

let state: RecapAudioState = INITIAL_STATE
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function setState(patch: Partial<RecapAudioState>) {
  state = { ...state, ...patch }
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => state
const getServerSnapshot = () => INITIAL_STATE

let audio: HTMLAudioElement | null = null

let onExpired: (() => void) | null = null

/**
 * Registers what to do when a clip fails to load — almost always a signed URL
 * that outlived its 6h window. The backend doc is explicit that a 403 means
 * "reload the recap", so the app wires this once to refetch the recap queries;
 * the next tap then gets a freshly minted URL.
 *
 * Kept out of the control component on purpose: `RecapAudioControls` stays a
 * drop-in that needs no data-layer context, and the retry button works with or
 * without a handler registered.
 */
export function setRecapAudioExpiryHandler(handler: (() => void) | null) {
  onExpired = handler
}

function ensureAudio(): HTMLAudioElement {
  if (audio) return audio

  const el = new Audio()
  // No `crossOrigin` — see the CORS note above.
  el.preload = 'none'
  el.playbackRate = state.rate

  // Read `paused` rather than inferring from the event name. Swapping `src` mid-
  // playback fires a `pause` *after* the new `play()` has already been issued, so
  // trusting the event alone leaves the new clip stuck showing as paused.
  el.addEventListener('play', () => setState({ isPlaying: !el.paused, errored: false }))
  el.addEventListener('pause', () => setState({ isPlaying: !el.paused }))
  el.addEventListener('timeupdate', () => setState({ currentTime: el.currentTime }))
  el.addEventListener('ended', () => setState({ isPlaying: false, currentTime: 0 }))
  el.addEventListener('error', () => {
    setState({ isPlaying: false, errored: true })
    onExpired?.()
  })
  // The element's own metadata wins once loaded; `duration_s` was only a seed.
  el.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(el.duration) && el.duration > 0) setState({ duration: el.duration })
  })

  audio = el
  return el
}

function applyMediaSession(track: RecapAudioTrack) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
  if (typeof MediaMetadata !== 'undefined') {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: 'Stonkie',
      album: 'Your morning brief',
    })
  }
  // Browsers throw for actions they don't support, so each one is set defensively.
  const handle = (action: MediaSessionAction, fn: MediaSessionActionHandler) => {
    try {
      navigator.mediaSession.setActionHandler(action, fn)
    } catch {
      // Unsupported action — lock-screen control degrades, playback is unaffected.
    }
  }

  handle('play', () => {
    void resume()
  })
  handle('pause', () => pause())
  handle('seekto', (details) => {
    if (typeof details.seekTime === 'number') seek(details.seekTime)
  })
  handle('seekbackward', () => seek(state.currentTime - 10))
  handle('seekforward', () => seek(state.currentTime + 10))
}

/** Starts `track`, replacing whatever was playing. Re-selecting the loaded track resumes it. */
export async function play(track: RecapAudioTrack) {
  const el = ensureAudio()

  if (state.trackId !== track.id || el.src !== track.url) {
    // Pause first so the swap's own pause/abort events settle against the old
    // clip instead of racing the new one.
    el.pause()
    el.src = track.url
    el.currentTime = 0
    setState({
      trackId: track.id,
      currentTime: 0,
      duration: track.duration,
      errored: false,
    })
    applyMediaSession(track)
  }

  el.playbackRate = state.rate
  try {
    await el.play()
  } catch {
    // Autoplay rejections and aborted loads both land here; the element's own
    // `error` event covers the cases worth surfacing.
  }
  // Reconcile once the promise settles, in case a stale event landed in between.
  setState({ isPlaying: !el.paused })
}

export function pause() {
  audio?.pause()
}

async function resume() {
  if (!audio) return
  try {
    await audio.play()
  } catch {
    // See note in `play`.
  }
}

/** Play/pause `track`, loading it first if a different clip is current. */
export function toggle(track: RecapAudioTrack) {
  if (state.trackId === track.id && state.isPlaying) {
    pause()
    return
  }
  void play(track)
}

export function seek(seconds: number) {
  if (!audio) return
  const max = state.duration || audio.duration || 0
  const clamped = Math.min(Math.max(seconds, 0), max)
  audio.currentTime = clamped
  setState({ currentTime: clamped })
}

export function setRate(rate: number) {
  if (audio) audio.playbackRate = rate
  setState({ rate })
}

/** Cycles to the next rate in `PLAYBACK_RATES` and returns it. */
export function cycleRate(): number {
  const idx = PLAYBACK_RATES.indexOf(state.rate as (typeof PLAYBACK_RATES)[number])
  const next = PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length]
  setRate(next)
  return next
}

/** Stops playback and forgets the track — the signed URL must not outlive the session. */
export function stop() {
  if (audio) {
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
  }
  setState({ trackId: null, isPlaying: false, currentTime: 0, duration: 0, errored: false })
}

/** How many mounted controls currently render each track id. */
const controlCount = new Map<string, number>()

/**
 * Registers a mounted control for `trackId` and returns its unregister function.
 *
 * When the last control for the loaded track goes away — the card unmounted, or
 * a cadence toggle swapped the recap out from under it — playback stops, so a
 * clip can never keep playing with nothing on screen to pause it. Surfaces that
 * show the same recap use distinct ids (see `RecapAudioTrack.id`), so closing one
 * of them never silences a clip another surface is still displaying.
 */
export function registerControl(trackId: string): () => void {
  controlCount.set(trackId, (controlCount.get(trackId) ?? 0) + 1)

  return () => {
    const remaining = (controlCount.get(trackId) ?? 1) - 1
    if (remaining > 0) {
      controlCount.set(trackId, remaining)
      return
    }
    controlCount.delete(trackId)
    if (state.trackId === trackId) stop()
  }
}

export function useRecapAudio(): RecapAudioState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Test-only: drops the shared element and resets state between cases. */
export function __resetRecapAudio() {
  audio = null
  state = INITIAL_STATE
  listeners.clear()
  controlCount.clear()
  onExpired = null
}

/** Test-only: the shared element, so tests can assert on it and fire media events. */
export function __getRecapAudioElement(): HTMLAudioElement | null {
  return audio
}
