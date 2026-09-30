import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { TickerSearchResult } from '@/app/types'

/** finnhub: common stocks, Finnhub symbols (BRK.B). yahoo: stocks + ETFs, Yahoo symbols (SXR8.DE). */
export type TickerSearchSource = 'finnhub' | 'yahoo'

const ENDPOINTS: Record<TickerSearchSource, string> = {
  finnhub: '/api/tickers',
  yahoo: '/api/tickers/yahoo',
}

async function fetchTickers(
  source: TickerSearchSource,
  query: string,
  signal: AbortSignal,
): Promise<TickerSearchResult[]> {
  const res = await fetch(`${ENDPOINTS[source]}?${new URLSearchParams({ q: query })}`, { signal })
  if (!res.ok) throw new Error(`Ticker search failed (${res.status})`)
  return (await res.json()) as TickerSearchResult[]
}

/**
 * Debounced ticker search (Finnhub by default, or Yahoo).
 * Empty results while the query is blank, debouncing, or on error.
 */
export function useTickerSearch(
  query: string,
  debounceMs = 300,
  source: TickerSearchSource = 'finnhub',
) {
  const trimmed = query.trim()
  const [debounced, setDebounced] = useState(trimmed)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(trimmed), debounceMs)
    return () => clearTimeout(t)
  }, [trimmed, debounceMs])

  const { data, isFetching } = useQuery({
    queryKey: ['ticker-search', source, debounced.toLowerCase()],
    queryFn: ({ signal }) => fetchTickers(source, debounced, signal),
    enabled: debounced.length > 0,
    staleTime: 10 * 60 * 1000,
    retry: false,
  })

  const settled = debounced === trimmed
  return {
    results: trimmed && settled ? (data ?? []) : [],
    isLoading: trimmed.length > 0 && (!settled || isFetching),
  }
}
