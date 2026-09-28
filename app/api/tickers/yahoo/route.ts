import { NextRequest, NextResponse } from 'next/server'
import type { TickerSearchResult } from '@/app/components/hooks/useTickerSearch'

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

// Listings rarely change; backend caches 1h. Short CDN cache absorbs typing bursts.
const CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=3600'

/**
 * Yahoo symbol search for portfolio holdings, via the backend (which prices holdings via Yahoo).
 * Unlike Finnhub it covers ETFs and non-US listings with exchange suffixes (SXR8 → SXR8.DE).
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 })
  }

  try {
    const params = new URLSearchParams({ q: q.slice(0, 64) })
    const response = await fetch(`${BACKEND_URL}/api/tickers/search?${params}`, {
      cache: 'no-store',
    })
    if (!response.ok) {
      return NextResponse.json({ error: 'Ticker search failed' }, { status: 502 })
    }

    const body = (await response.json()) as { data: TickerSearchResult[] }
    return NextResponse.json(body.data, { headers: { 'Cache-Control': CACHE_CONTROL } })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tickers' }, { status: 502 })
  }
}
