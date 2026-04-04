import { NextRequest, NextResponse } from 'next/server'

interface FinnhubMatch {
  description: string
  displaySymbol: string
  type: string
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q) {
    return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 })
  }

  const token = process.env.FINNHUB_API_KEY
  if (!token) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    const params = new URLSearchParams({ q, token })
    const response = await fetch(`https://finnhub.io/api/v1/search?${params}`)

    if (!response.ok) {
      return NextResponse.json({ error: 'Upstream Finnhub error' }, { status: 502 })
    }

    const data = await response.json()

    const results = (data.result ?? [])
      .filter((match: FinnhubMatch) => match.type === 'Common Stock')
      .map((match: FinnhubMatch) => ({
        symbol: match.displaySymbol,
        name: match.description,
      }))

    return NextResponse.json(results)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tickers' }, { status: 502 })
  }
}
