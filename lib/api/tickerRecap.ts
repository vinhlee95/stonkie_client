import type { RecapBullet, RecapSource } from '@/lib/api/marketRecap'
import type { PriceChange } from '@/lib/api/quotes'

/**
 * Per-ticker precomputed daily recap from the backend.
 * GET /api/companies/{ticker}/recaps?cadence=daily&limit=1
 *
 * Reads precomputed rows only — no on-demand generation. Today only the
 * POPULAR_TICKERS (NVDA/AAPL/TSLA/GOOG) have rows; every other ticker
 * resolves to null.
 */
export type TickerRecapItem = {
  id: number
  period_start: string
  period_end: string
  created_at: string | null
  summary: string
  bullets: RecapBullet[]
  sources: RecapSource[]
  /** Latest completed trading day's move; null when unavailable. */
  price_change: PriceChange | null
}

export type TickerRecapResponse = {
  ticker: string
  cadence: string
  latest_created_at: string | null
  items: TickerRecapItem[]
}

/** Fetches the latest daily recap for a ticker from the BFF proxy. Null when none. */
export async function fetchTickerRecap(ticker: string): Promise<TickerRecapItem | null> {
  const res = await fetch(`/api/companies/${encodeURIComponent(ticker)}/recaps`)
  if (!res.ok) return null
  return (await res.json()) as TickerRecapItem | null
}
