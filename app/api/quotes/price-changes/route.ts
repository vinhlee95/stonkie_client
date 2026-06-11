import { NextRequest, NextResponse } from 'next/server'
import { PRICE_CHANGES_MAX_TICKERS, type PriceChangesResponse } from '@/lib/api/quotes'

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

// Quotes change once per trading day; backend caches ~6h. Short CDN cache to absorb bursts.
const CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=299'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const raw = req.nextUrl.searchParams.get('tickers') ?? ''
  const tickers = [
    ...new Set(
      raw
        .split(',')
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean),
    ),
  ]

  if (tickers.length === 0 || tickers.length > PRICE_CHANGES_MAX_TICKERS) {
    return NextResponse.json({ error: 'tickers must contain 1-50 symbols' }, { status: 422 })
  }

  const url = `${BACKEND_URL}/api/quotes/price-changes?tickers=${encodeURIComponent(tickers.join(','))}`
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    return NextResponse.json({ error: 'failed to fetch price changes' }, { status: 502 })
  }

  const body = (await response.json()) as PriceChangesResponse

  return NextResponse.json(body, { headers: { 'Cache-Control': CACHE_CONTROL } })
}
