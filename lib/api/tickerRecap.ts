import type { RecapBullet, RecapSource } from '@/lib/api/marketRecap'
import type { PriceChange } from '@/lib/api/quotes'

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

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

export type TickerRecapCadence = 'daily' | 'weekly'

/** Latest daily + weekly recap for a ticker; either may be null when absent. */
export type TickerRecapPair = {
  daily: TickerRecapItem | null
  weekly: TickerRecapItem | null
}

/** Fetches the latest recap for a ticker/cadence from the BFF proxy. Null when none. */
export async function fetchTickerRecap(
  ticker: string,
  cadence: TickerRecapCadence = 'daily',
): Promise<TickerRecapItem | null> {
  const res = await fetch(`/api/companies/${encodeURIComponent(ticker)}/recaps?cadence=${cadence}`)
  if (!res.ok) return null
  return (await res.json()) as TickerRecapItem | null
}

/**
 * Server-side: reads one cadence's latest precomputed recap straight from the
 * backend (not the BFF proxy), so the ticker page can render it during SSR.
 */
async function getServerTickerRecap(
  ticker: string,
  cadence: TickerRecapCadence,
): Promise<TickerRecapItem | null> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/companies/${ticker}/recaps?cadence=${cadence}&limit=1`,
      { next: { revalidate: 10 * 60, tags: ['ticker-recaps'] } },
    )
    if (!res.ok) return null
    const json = (await res.json()) as { items?: TickerRecapItem[] }
    return json.items?.[0] ?? null
  } catch {
    return null
  }
}

/**
 * Server-side: fetches daily + weekly recaps in parallel for the ticker page.
 * Each cadence resolves to null independently when the backend has no row.
 */
export async function getTickerRecapPair(ticker: string): Promise<TickerRecapPair> {
  const symbol = ticker.toUpperCase()
  const [daily, weekly] = await Promise.all([
    getServerTickerRecap(symbol, 'daily'),
    getServerTickerRecap(symbol, 'weekly'),
  ])
  return { daily, weekly }
}
