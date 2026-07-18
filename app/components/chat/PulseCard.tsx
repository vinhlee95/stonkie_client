'use client'

import { ArrowRight } from 'lucide-react'
import RecapAudioControls from './RecapAudioControls'
import type { BriefMarketData } from '../hooks/useBriefData'

interface PulseCardProps {
  market: BriefMarketData
  favouriteCount: number
  onDigIn: () => void
}

export default function PulseCard({ market, favouriteCount, onDigIn }: PulseCardProps) {
  const { recap } = market
  const { flag, label, indexLabel } = market.market

  return (
    // Not a single <button>: the audio controls are interactive, so the dig-in
    // target is the inner button and the header sits outside it.
    <div className="rounded-2xl border border-[var(--border-soft)] bg-gradient-to-br from-[var(--accent-light)] to-[#f4f8f5] dark:to-[#1a2e26] p-4">
      {/* Header: flag + label + index, with the listen control on the right */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none">{flag}</span>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--accent-active)] dark:text-[var(--accent-active-dark)]">
            {label} Pulse
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 truncate">· {indexLabel}</span>
        </div>
        {recap && (
          <RecapAudioControls
            audio={recap.audio}
            trackId={`brief:market:${market.market.key}:${recap.id}`}
            title={`${label} Pulse`}
          />
        )}
      </div>

      <button
        onClick={onDigIn}
        className="w-full text-left cursor-pointer rounded-lg transition-colors hover:bg-white/40 dark:hover:bg-white/5 -mx-1 px-1 py-0.5"
      >
        {/* Headline */}
        {recap ? (
          <p className="text-base md:text-lg leading-relaxed text-gray-800 dark:text-gray-200">
            {recap.summary}
          </p>
        ) : (
          <p className="text-base md:text-lg leading-relaxed text-gray-400 dark:text-gray-500 italic">
            No recap available
          </p>
        )}

        {/* Footer: Dig in + favourite count */}
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-base font-semibold text-[var(--accent-active)] dark:text-[var(--accent-active-dark)]">
            Dig in
            <ArrowRight size={14} strokeWidth={2.5} />
          </span>
          {favouriteCount > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {favouriteCount} {favouriteCount === 1 ? 'favourite' : 'favourites'} here
            </span>
          )}
        </div>
      </button>
    </div>
  )
}
