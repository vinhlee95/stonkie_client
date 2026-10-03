import { useQuery } from '@tanstack/react-query'
import { fetchPerformance, PERFORMANCE_QUERY_KEY } from '@/lib/api/portfolio'

/**
 * Daily portfolio vs S&P 500 history, fetched once per dashboard mount;
 * range buttons slice it client-side. Lot writes refetch it via the
 * portfolio key prefix. Closes change once a day (backend caches 12h).
 * Disabled for an empty portfolio, which has no chart.
 */
export function usePortfolioPerformance(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: PERFORMANCE_QUERY_KEY,
    queryFn: fetchPerformance,
    staleTime: 6 * 60 * 60 * 1000,
    // Same as usePortfolio: a kept entry could show the previous account's history.
    gcTime: 0,
  })
}
