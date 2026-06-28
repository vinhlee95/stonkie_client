import { NextRequest, NextResponse } from 'next/server'
import type { TickerRecapItem } from '@/lib/api/tickerRecap'
import { COMPANIES_RECAPS_ROUTE_CACHE_CONTROL } from './cache'

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

/** Allowed tickers: 1-10 alphanumerics, optional dot/dash segment (e.g. BRK.B). */
const TICKER_RE = /^[A-Z0-9]{1,10}([.-][A-Z0-9]{1,4})?$/

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ ticker: string }> },
): Promise<NextResponse> {
  const ticker = (await context.params).ticker.toUpperCase()

  if (!TICKER_RE.test(ticker)) {
    return NextResponse.json({ error: 'invalid ticker' }, { status: 400 })
  }

  const url = `${BACKEND_URL}/api/companies/${ticker}/recaps?cadence=daily&limit=1`
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    return NextResponse.json(null, {
      headers: { 'Cache-Control': COMPANIES_RECAPS_ROUTE_CACHE_CONTROL },
    })
  }

  const json = (await response.json()) as { items?: TickerRecapItem[] }
  const item = json.items?.[0] ?? null

  return NextResponse.json(item, {
    headers: { 'Cache-Control': COMPANIES_RECAPS_ROUTE_CACHE_CONTROL },
  })
}
