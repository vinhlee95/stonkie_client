import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

export type TickerSearchResult = { symbol: string; name: string }

async function fetchTickers(query: string, signal: AbortSignal): Promise<TickerSearchResult[]> {
  const res = await fetch(`/api/tickers?${new URLSearchParams({ q: query })}`, { signal })
  if (!res.ok) throw new Error(`Ticker search failed (${res.status})`)
  return (await res.json()) as TickerSearchResult[]
}

/**
 * Debounced Finnhub ticker search via /api/tickers (common stocks only).
 * Empty results while the query is blank, debouncing, or on error.
 */
export function useTickerSearch(query: string, debounceMs = 300) {
  const trimmed = query.trim()
  const [debounced, setDebounced] = useState(trimmed)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(trimmed), debounceMs)
    return () => clearTimeout(t)
  }, [trimmed, debounceMs])

  const { data, isFetching } = useQuery({
    queryKey: ['ticker-search', debounced.toLowerCase()],
    queryFn: ({ signal }) => fetchTickers(debounced, signal),
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
