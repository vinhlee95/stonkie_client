import { useQuery } from '@tanstack/react-query'
import { fetchPriceChanges, PRICE_CHANGES_MAX_TICKERS, type PriceChange } from '@/lib/api/quotes'

/**
 * Fetches daily price changes for a list of tickers in one batch call.
 * Returns a map of ticker → PriceChange; tickers the backend couldn't
 * resolve are absent. Empty map while loading or on error — callers
 * render rows without a badge in that case.
 */
export function usePriceChanges(tickers: string[]): Record<string, PriceChange> {
  // Sort for a stable query key regardless of favourites order; cap at the
  // backend's batch limit so an oversized watchlist degrades gracefully.
  const sorted = [...new Set(tickers.map((t) => t.toUpperCase()))]
    .sort()
    .slice(0, PRICE_CHANGES_MAX_TICKERS)

  const { data } = useQuery({
    queryKey: ['price-changes', sorted.join(',')],
    queryFn: () => fetchPriceChanges(sorted),
    enabled: sorted.length > 0,
    staleTime: 10 * 60 * 1000,
    retry: false,
  })

  return data?.quotes ?? {}
}
