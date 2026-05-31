'use client'

import { ArrowRight } from 'lucide-react'
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
    <button
      onClick={onDigIn}
      className="w-full text-left rounded-2xl border border-[var(--border-soft)] bg-gradient-to-br from-[var(--accent-light)] to-[#f4f8f5] dark:to-[#1a2e26] hover:from-[rgba(40,105,86,0.12)] hover:to-[#eef4ef] dark:hover:to-[#1f352c] transition-colors p-4 cursor-pointer"
    >
      {/* Header: flag + label + index */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{flag}</span>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--accent-active)] dark:text-[var(--accent-active-dark)]">
            {label} Pulse
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">· {indexLabel}</span>
        </div>
      </div>

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
  )
}
