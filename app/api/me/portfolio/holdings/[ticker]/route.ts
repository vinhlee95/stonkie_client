import { NextRequest, NextResponse } from 'next/server'
import { TICKER_RE } from '@/lib/api/portfolio'
import { proxyToBackend } from '../../proxy'

type Context = { params: Promise<{ ticker: string }> }

async function tickerPath(context: Context): Promise<string | null> {
  const ticker = (await context.params).ticker.trim().toUpperCase()
  return TICKER_RE.test(ticker) ? `/api/me/portfolio/holdings/${encodeURIComponent(ticker)}` : null
}

export async function PUT(req: NextRequest, context: Context) {
  const path = await tickerPath(context)
  if (!path) return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })
  const body = await req.text()
  return proxyToBackend(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

export async function DELETE(_req: NextRequest, context: Context) {
  const path = await tickerPath(context)
  if (!path) return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })
  return proxyToBackend(path, { method: 'DELETE' })
}
