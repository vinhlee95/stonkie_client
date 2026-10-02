import { NextRequest, NextResponse } from 'next/server'
import { TICKER_RE } from '@/lib/api/portfolio'
import { proxyToBackend } from '../../../proxy'

type Context = { params: Promise<{ ticker: string }> }

export async function POST(req: NextRequest, context: Context) {
  const ticker = (await context.params).ticker.trim().toUpperCase()
  if (!TICKER_RE.test(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })
  }
  return proxyToBackend(`/api/me/portfolio/holdings/${encodeURIComponent(ticker)}/lots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: await req.text(),
  })
}
