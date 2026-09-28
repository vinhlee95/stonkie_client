import { NextRequest, NextResponse } from 'next/server'

interface YahooQuote {
  symbol?: string
  shortname?: string
  longname?: string
  quoteType?: string
  exchDisp?: string
  isYahooFinance?: boolean
}

// Holdable instruments; skips indices, currencies, futures, options.
const QUOTE_TYPES = new Set(['EQUITY', 'ETF', 'MUTUALFUND'])

/**
 * Yahoo Finance symbol search for portfolio holdings, which the backend prices via Yahoo.
 * Unlike Finnhub it covers ETFs and non-US listings with exchange suffixes (SXR8 → SXR8.DE).
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 })
  }

  try {
    const params = new URLSearchParams({
      q: q.slice(0, 64),
      quotesCount: '10',
      newsCount: '0',
      listsCount: '0',
    })
    const response = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?${params}`, {
      // Yahoo rejects requests without a browser-like User-Agent.
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Upstream Yahoo error' }, { status: 502 })
    }

    const data = (await response.json()) as { quotes?: YahooQuote[] }

    const results = (data.quotes ?? [])
      .filter(
        (quote) => quote.symbol && quote.isYahooFinance && QUOTE_TYPES.has(quote.quoteType ?? ''),
      )
      .map((quote) => ({
        symbol: quote.symbol!.toUpperCase(),
        name: quote.longname || quote.shortname || quote.symbol!,
        exchange: quote.exchDisp ?? null,
      }))

    return NextResponse.json(results)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tickers' }, { status: 502 })
  }
}
