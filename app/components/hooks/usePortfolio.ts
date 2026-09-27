import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchPortfolio, PORTFOLIO_QUERY_KEY, type Portfolio } from '@/lib/api/portfolio'

/**
 * The signed-in user's portfolio, seeded with the server-rendered snapshot.
 * `refresh` marks it stale and refetches in the background without blocking
 * the caller, so a dialog can close as soon as its write succeeds.
 */
export function usePortfolio(initialData: Portfolio) {
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: PORTFOLIO_QUERY_KEY,
    queryFn: fetchPortfolio,
    initialData,
    staleTime: 60 * 1000,
  })

  const refresh = useCallback(
    () => void queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY }),
    [queryClient],
  )

  return { data, refresh }
}
