'use client'

import { useEffect } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import {
  cycleRate,
  registerControl,
  seek,
  toggle,
  useRecapAudio,
  type RecapAudioTrack,
} from './hooks/useRecapAudio'
import type { RecapAudio } from '@/lib/api/marketRecap'

interface RecapAudioControlsProps {
  /** The recap's audio payload. Renders nothing when the backend sent null. */
  audio: RecapAudio | null | undefined
  /**
   * Stable id, namespaced by the surface rendering this control — e.g.
   * `home:ticker:NVDA:412`. Two surfaces showing the same recap must pass
   * different ids so closing one does not stop playback the other still shows.
   */
  trackId: string
  /** Clip name, used for the accessible label and the OS media notification. */
  title: string
  className?: string
}

/** Formats seconds as m:ss. */
function formatTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

/**
 * Play control for a narrated recap clip. Drop it anywhere a recap is rendered:
 * it needs only the recap's `audio` payload, a unique id, and a title.
 *
 * Collapsed it is a play button plus the clip length; playing expands it in place
 * to a scrubber, elapsed/total time, and a speed toggle. Playback itself lives in
 * a shared single-player store, so starting one clip stops whatever else is
 * playing anywhere in the app.
 *
 * Safe inside a link or a clickable card — every control stops the event from
 * reaching an enclosing handler.
 */
export default function RecapAudioControls({
  audio,
  trackId,
  title,
  className = '',
}: RecapAudioControlsProps) {
  const state = useRecapAudio()

  const isActive = state.trackId === trackId
  // Set when the clip failed to load — usually an expired signed URL. The store's
  // expiry handler refetches the recap; here the button just becomes a retry.
  const errored = isActive && state.errored
  const url = audio?.url

  // Stops playback if this control goes away (or its recap is swapped out) while
  // its clip is the one playing — no audio without a visible pause button.
  useEffect(() => {
    if (!url) return
    return registerControl(trackId)
  }, [trackId, url])

  // Recaps without audio look exactly as they did before this feature.
  if (!audio?.url) return null

  const track: RecapAudioTrack = {
    id: trackId,
    url: audio.url,
    title,
    duration: audio.duration_s,
  }

  const playing = isActive && state.isPlaying
  // `duration_s` is exact, so the total renders correctly on first paint.
  const duration = isActive && state.duration > 0 ? state.duration : audio.duration_s
  const elapsed = isActive ? state.currentTime : 0

  const stopBubbling = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          stopBubbling(e)
          toggle(track)
        }}
        aria-label={
          errored
            ? `Retry listening to ${title}`
            : playing
              ? `Pause ${title}`
              : `Listen to ${title}`
        }
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-active)] text-white transition-transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        {errored ? (
          <RotateCcw size={12} strokeWidth={2.6} />
        ) : playing ? (
          <Pause size={12} strokeWidth={2.6} fill="currentColor" />
        ) : (
          <Play size={12} strokeWidth={2.6} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      {isActive ? (
        <>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.5}
            value={Math.min(elapsed, duration)}
            onChange={(e) => seek(Number(e.target.value))}
            onClick={stopBubbling}
            // Inside a link, a drag on the thumb would otherwise start a native
            // link drag instead of scrubbing.
            onPointerDown={(e) => e.stopPropagation()}
            onDragStart={(e) => e.preventDefault()}
            draggable={false}
            aria-label={`Seek within ${title}`}
            className="h-1 min-w-0 flex-1 cursor-pointer accent-[var(--accent-active)]"
          />
          <span className="shrink-0 font-mono text-xs tabular-nums text-gray-500 dark:text-gray-400">
            {formatTime(elapsed)} / {formatTime(duration)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              stopBubbling(e)
              cycleRate()
            }}
            aria-label="Change playback speed"
            className="shrink-0 rounded-full border border-gray-200 px-1.5 py-0.5 font-mono text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
          >
            {state.rate}x
          </button>
        </>
      ) : (
        <span className="font-mono text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {formatTime(duration)}
        </span>
      )}
    </div>
  )
}
