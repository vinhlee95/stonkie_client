import { useQueries } from '@tanstack/react-query'
import type { MarketRecapItem, MarketRecapPair } from '@/lib/api/marketRecap'
import type { BriefMarket, BriefMarketsResult } from './useBriefMarkets'

export interface BriefMarketData {
  market: BriefMarket
  recap: MarketRecapItem | null
  recapId: string | null
}

export interface BriefData {
  markets: BriefMarketData[]
  isLoading: boolean
}

async function fetchRecapPair(backendCode: string): Promise<MarketRecapPair> {
  const res = await fetch(`/api/markets/${encodeURIComponent(backendCode)}/recaps`)
  if (!res.ok) throw new Error(`Failed to fetch recaps for ${backendCode}`)
  return (await res.json()) as MarketRecapPair
}

/**
 * Fetches recap data for all markets in the brief.
 * Uses React Query for client-side caching (~5 min stale time).
 * Prefers daily recap; falls back to weekly.
 */
export function useBriefData(briefMarkets: BriefMarketsResult): BriefData {
  const allMarkets = [briefMarkets.primary, ...briefMarkets.secondaries]

  const queries = useQueries({
    queries: allMarkets.map((m) => ({
      queryKey: ['brief-recap', m.backendCode],
      queryFn: () => fetchRecapPair(m.backendCode),
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  })

  const isLoading = queries.some((q) => q.isLoading)

  const markets: BriefMarketData[] = allMarkets.map((market, i) => {
    const query = queries[i]
    const pair = query.data ?? null
    const recap = pair?.daily ?? pair?.weekly ?? null

    return {
      market,
      recap,
      recapId: recap ? String(recap.id) : null,
    }
  })

  return { markets, isLoading }
}
