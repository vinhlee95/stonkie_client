'use client'

import { ChevronRight, Sparkles } from 'lucide-react'
import type { BriefMarketData } from '../hooks/useBriefData'

interface CollapsedMarketRowProps {
  market: BriefMarketData
  favouriteCount: number
  expanded: boolean
  onToggle: () => void
  onDigIn: () => void
  onAskQuestion: (q: string) => void
}

export default function CollapsedMarketRow({
  market,
  favouriteCount,
  expanded,
  onToggle,
  onDigIn,
  onAskQuestion,
}: CollapsedMarketRowProps) {
  const { recap } = market
  const { flag, label } = market.market
  const headline = recap?.summary ?? ''
  const firstSentence = headline.split('.')[0] + (headline.includes('.') ? '.' : '')
  const questions = recap?.questions ?? []

  return (
    <div
      className={`rounded-xl border transition-colors ${
        expanded
          ? 'border-[var(--accent-active)]/30 bg-[var(--accent-light)]/40'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
      }`}
    >
      {/* Collapsed header — always visible */}
      <button
        onClick={onToggle}
        aria-label={label}
        className="w-full text-left flex items-center justify-between gap-2 px-3.5 py-3 cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-lg leading-none">{flag}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {label}
              </span>
              {favouriteCount > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  · {favouriteCount} {favouriteCount === 1 ? 'favourite' : 'favourites'}
                </span>
              )}
            </div>
            {!expanded && headline && (
              <div className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                {firstSentence}
              </div>
            )}
          </div>
        </div>
        <ChevronRight
          size={14}
          className={`text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-3.5 pb-3.5 pt-1.5 border-t border-gray-200 dark:border-gray-700">
          <p className="text-base md:text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            {headline}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {/* Dig into pulse — primary CTA */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDigIn()
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[var(--accent-active)] text-white text-sm font-semibold cursor-pointer"
            >
              <Sparkles size={12} strokeWidth={2.4} />
              Dig into pulse
            </button>
            {/* Question chips — max 2, truncated at 38 chars */}
            {questions.slice(0, 2).map((q) => (
              <button
                key={q}
                onClick={(e) => {
                  e.stopPropagation()
                  onAskQuestion(q)
                }}
                className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                {q.length > 38 ? q.slice(0, 38) + '…' : q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
