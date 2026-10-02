import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchPortfolio, PORTFOLIO_QUERY_KEY, type Portfolio } from '@/lib/api/portfolio'

/**
 * The signed-in user's portfolio, seeded with the server-rendered snapshot
 * on every mount.
 * `refresh` marks it stale and refetches in the background without blocking
 * the caller, so a dialog can close as soon as its write succeeds.
 * `sync` refetches and resolves once that settles, for views that stay open
 * after a write: true when fresh data arrived, false when the refetch failed
 * (it never rejects; the last good data stays).
 */
export function usePortfolio(initialData: Portfolio) {
  const queryClient = useQueryClient()
  const { data, refetch } = useQuery({
    queryKey: PORTFOLIO_QUERY_KEY,
    queryFn: fetchPortfolio,
    initialData,
    staleTime: 60 * 1000,
    // Matches the backend's 5 min live-quote cache; paused while the tab is hidden.
    refetchInterval: 5 * 60 * 1000,
    // Drop the entry once the dashboard unmounts. The app-wide client keeps
    // queries for 30 min without refetching on mount, so a kept entry would
    // override the next server snapshot: stale values, or the previous
    // account's holdings if the session changed without a full reload.
    gcTime: 0,
  })

  const refresh = useCallback(
    () => void queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY }),
    [queryClient],
  )

  const sync = useCallback(async () => !(await refetch()).isError, [refetch])

  return { data, refresh, sync }
}
