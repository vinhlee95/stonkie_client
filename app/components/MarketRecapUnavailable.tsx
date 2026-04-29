'use client'

import { MARKET_RECAP_ISLAND_SECTION_LAYOUT } from './marketRecapIslandLayout'

export type MarketRecapUnavailableVariant = 'fetch-failed' | 'no-data'
export type MarketRecapUnavailablePeriod = 'day' | 'week'

interface MarketRecapUnavailableProps {
  variant: MarketRecapUnavailableVariant
  /** Used when variant is `no-data` — which period to mention in copy. */
  period?: MarketRecapUnavailablePeriod
  onRetry: () => void
}

export default function MarketRecapUnavailable({
  variant,
  period = 'week',
  onRetry,
}: MarketRecapUnavailableProps) {
  const message =
    variant === 'fetch-failed'
      ? "We couldn't load the market recap. Please try again."
      : period === 'day'
        ? 'No market recap for this day. Please try again.'
        : 'No market recap for this week. Please try again.'

  return (
    <section
      aria-label="Market recap"
      className={`rounded-2xl border border-[rgba(40,105,86,0.13)] bg-[var(--button-background)] dark:bg-[var(--button-background-dark)] overflow-visible ${MARKET_RECAP_ISLAND_SECTION_LAYOUT}`}
    >
      <div className="px-4 py-3 flex-1 flex flex-col justify-center items-center gap-4 text-center min-h-0">
        <p className="text-base md:text-lg leading-relaxed text-gray-700 dark:text-gray-200 max-w-md">
          {message}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl border border-[rgba(40,105,86,0.25)] dark:border-[rgba(156,214,194,0.35)] bg-white/80 dark:bg-gray-800/80 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-[var(--accent-hover)]/10 dark:hover:bg-[var(--accent-hover-dark)]/15 transition-colors"
        >
          Try again
        </button>
      </div>
    </section>
  )
}
