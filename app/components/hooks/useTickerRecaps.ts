import { useQueries } from '@tanstack/react-query'
import { fetchTickerRecap, type TickerRecapItem } from '@/lib/api/tickerRecap'

/**
 * Fetches each favourite's latest precomputed daily recap (one query per ticker,
 * mirroring usePriceChanges). Returns a map of ticker → recap; tickers without a
 * precomputed recap resolve to null silently (404/empty → null, not error).
 * Only the POPULAR_TICKERS (NVDA/AAPL/TSLA/GOOG) currently resolve to a recap.
 */
export function useTickerRecaps(tickers: string[]): Record<string, TickerRecapItem | null> {
  const uniq = [...new Set(tickers.map((t) => t.toUpperCase()))].sort()

  const results = useQueries({
    queries: uniq.map((ticker) => ({
      queryKey: ['ticker-recap', ticker],
      queryFn: () => fetchTickerRecap(ticker),
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  })

  const map: Record<string, TickerRecapItem | null> = {}
  uniq.forEach((ticker, i) => {
    map[ticker] = results[i]?.data ?? null
  })
  return map
}
