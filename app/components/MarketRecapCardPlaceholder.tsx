import { MARKET_RECAP_ISLAND_SECTION_LAYOUT } from './marketRecapIslandLayout'

/** Shell matching MarketRecapCard chrome; shown while recap fetch is in flight (cf. chat thread before answer). */
function ShimmerBar({
  className,
  rounded = 'rounded',
}: {
  className: string
  rounded?: 'rounded' | 'rounded-full' | 'rounded-sm'
}) {
  return (
    <div aria-hidden className={`market-recap-placeholder-shimmer-bar ${rounded} ${className}`} />
  )
}

export default function MarketRecapCardPlaceholder() {
  return (
    <section
      aria-label="Market recap"
      aria-busy="true"
      className={`rounded-2xl border border-[rgba(40,105,86,0.13)] bg-[var(--button-background)] dark:bg-[var(--button-background-dark)] overflow-visible ${MARKET_RECAP_ISLAND_SECTION_LAYOUT}`}
    >
      <div className="px-4 py-3 flex-1 flex flex-col justify-start min-h-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <ShimmerBar className="h-7 w-36" rounded="rounded-full" />
              <ShimmerBar className="h-7 w-28" rounded="rounded-full" />
              <ShimmerBar className="h-7 w-40" rounded="rounded-full" />
            </div>
            <ShimmerBar className="h-5 w-full max-w-xl" />
            <ShimmerBar className="h-5 w-full max-w-lg" />
            <ShimmerBar className="h-5 w-2/3 max-w-md" />
            <ShimmerBar className="h-6 w-48" rounded="rounded-full" />
          </div>
          <ShimmerBar className="mt-1 h-[13px] w-[13px] shrink-0" rounded="rounded-sm" />
        </div>
      </div>
      <p role="status" aria-live="polite" aria-label="Loading market recap" className="sr-only">
        Loading market recap
      </p>
    </section>
  )
}
