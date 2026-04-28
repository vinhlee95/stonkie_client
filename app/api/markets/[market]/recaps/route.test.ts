import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'
import { MARKETS_RECAPS_ROUTE_CACHE_CONTROL } from './cache'

function getReq(path: string) {
  return new NextRequest(`http://localhost${path}`)
}

describe('GET /api/markets/{market}/recaps', () => {
  const originalFetch = globalThis.fetch
  const originalBackend = process.env.BACKEND_URL

  beforeEach(() => {
    process.env.BACKEND_URL = 'http://test-backend:8080'
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    process.env.BACKEND_URL = originalBackend
  })

  it('returns 400 for unknown market segment', async () => {
    const res = await GET(getReq('/api/markets/ZZ/recaps'), {
      params: Promise.resolve({ market: 'ZZ' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns Cache-Control with 60s s-maxage and aggregates daily+weekly from same backend path shape', async () => {
    const dailyItem = {
      period_start: '2026-04-24',
      period_end: '2026-04-24',
      created_at: '2026-04-25T01:00:00Z',
      summary: 'Daily summary',
      bullets: [],
      sources: [],
    }
    const weeklyItem = {
      period_start: '2026-04-20',
      period_end: '2026-04-24',
      created_at: '2026-04-25T13:00:00Z',
      summary: 'Weekly summary',
      bullets: [],
      sources: [],
    }

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('cadence=daily')) {
        return new Response(JSON.stringify({ items: [dailyItem] }), { status: 200 })
      }
      if (url.includes('cadence=weekly')) {
        return new Response(JSON.stringify({ items: [weeklyItem] }), { status: 200 })
      }
      return new Response('not found', { status: 404 })
    }) as typeof fetch

    const res = await GET(getReq('/api/markets/US/recaps'), {
      params: Promise.resolve({ market: 'US' }),
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe(MARKETS_RECAPS_ROUTE_CACHE_CONTROL)

    const body = (await res.json()) as { daily: unknown; weekly: unknown }
    expect(body.daily).toEqual(dailyItem)
    expect(body.weekly).toEqual(weeklyItem)

    const calls = vi.mocked(globalThis.fetch).mock.calls.map((c) => String(c[0]))
    expect(
      calls.some((u) => u.includes('/api/markets/US/recaps') && u.includes('cadence=daily')),
    ).toBe(true)
    expect(
      calls.some((u) => u.includes('/api/markets/US/recaps') && u.includes('cadence=weekly')),
    ).toBe(true)
  })

  it('uses cache no-store on upstream backend fetches', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ items: [] }), { status: 200 }),
    )

    await GET(getReq('/api/markets/FI/recaps'), {
      params: Promise.resolve({ market: 'FI' }),
    })

    for (const call of vi.mocked(globalThis.fetch).mock.calls) {
      const init = call[1] as RequestInit | undefined
      expect(init?.cache).toBe('no-store')
    }
  })
})
