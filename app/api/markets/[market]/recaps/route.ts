import { NextRequest, NextResponse } from 'next/server'
import {
  FRONTEND_TO_BACKEND_MARKET,
  type MarketRecapItem,
  type MarketRecapPair,
} from '@/lib/api/marketRecap'

/** CDN/browser cache for aggregated recap JSON; upstream uses no-store on cache miss. */
export const MARKETS_RECAPS_ROUTE_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=59'

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

const ALLOWED_BACKEND_MARKETS = new Set<string>(Object.values(FRONTEND_TO_BACKEND_MARKET))

async function fetchLatestItem(
  backendMarket: string,
  cadence: 'daily' | 'weekly',
): Promise<MarketRecapItem | null> {
  const url = `${BACKEND_URL}/api/markets/${backendMarket}/recaps?cadence=${cadence}&limit=1`
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) return null
  const json = (await response.json()) as { items?: MarketRecapItem[] }
  return json.items?.[0] ?? null
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ market: string }> },
): Promise<NextResponse> {
  const raw = (await context.params).market
  const backendMarket = raw.toUpperCase()

  if (!ALLOWED_BACKEND_MARKETS.has(backendMarket)) {
    return NextResponse.json({ error: 'invalid market' }, { status: 400 })
  }

  const [daily, weekly] = await Promise.all([
    fetchLatestItem(backendMarket, 'daily'),
    fetchLatestItem(backendMarket, 'weekly'),
  ])

  const body: MarketRecapPair = { daily, weekly }

  return NextResponse.json(body, {
    headers: { 'Cache-Control': MARKETS_RECAPS_ROUTE_CACHE_CONTROL },
  })
}
