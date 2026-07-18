'use client'

import { Pause, Play, RotateCcw } from 'lucide-react'
import {
  cycleRate,
  seek,
  toggle,
  useRecapAudio,
  type RecapAudioTrack,
} from '../hooks/useRecapAudio'
import type { RecapAudio } from '@/lib/api/marketRecap'

interface RecapAudioControlsProps {
  /** The recap's audio payload. Render nothing when the backend sent null. */
  audio: RecapAudio | null | undefined
  /** Stable track id, e.g. `market:US:257`. */
  trackId: string
  /** Shown on the lock screen / media notification. */
  title: string
  /**
   * `full` adds a scrubber and rate toggle once the clip is active; `compact` is
   * a play button plus the running time, for rows that are themselves links.
   */
  variant?: 'full' | 'compact'
  className?: string
}

/** Formats seconds as m:ss. */
function formatTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export default function RecapAudioControls({
  audio,
  trackId,
  title,
  variant = 'full',
  className = '',
}: RecapAudioControlsProps) {
  const state = useRecapAudio()

  const isActive = state.trackId === trackId
  // A failed load almost always means the signed URL outlived its 6h window.
  // `useRecapAudioRecovery` refetches the recaps; the button becomes a retry.
  const errored = isActive && state.errored

  // Cards without audio look exactly as they did before this feature.
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

  const stopBubbling = (e: React.MouseEvent | React.PointerEvent | React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const playButton = (
    <button
      type="button"
      onClick={(e) => {
        stopBubbling(e)
        toggle(track)
      }}
      aria-label={
        errored ? `Retry listening to ${title}` : playing ? `Pause ${title}` : `Listen to ${title}`
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
  )

  if (variant === 'compact' || !isActive) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {playButton}
        <span className="font-mono text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {isActive ? `${formatTime(elapsed)} / ${formatTime(duration)}` : formatTime(duration)}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {playButton}
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={0.5}
        value={Math.min(elapsed, duration)}
        onChange={(e) => seek(Number(e.target.value))}
        onClick={stopBubbling}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={`Seek within ${title}`}
        className="h-1 flex-1 min-w-0 cursor-pointer accent-[var(--accent-active)]"
      />
      <span className="font-mono text-xs tabular-nums text-gray-500 dark:text-gray-400 shrink-0">
        {formatTime(elapsed)} / {formatTime(duration)}
      </span>
      <button
        type="button"
        onClick={(e) => {
          stopBubbling(e)
          cycleRate()
        }}
        aria-label="Change playback speed"
        className="shrink-0 rounded-full border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 font-mono text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
      >
        {state.rate}x
      </button>
    </div>
  )
}
