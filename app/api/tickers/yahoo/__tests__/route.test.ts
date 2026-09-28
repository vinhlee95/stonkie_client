// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'

const fetchMock = vi.fn()
const req = (q?: string) =>
  new NextRequest(
    `http://localhost/api/tickers/yahoo${q === undefined ? '' : `?${new URLSearchParams({ q })}`}`,
  )

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('GET /api/tickers/yahoo', () => {
  it('returns 400 without q', async () => {
    expect((await GET(req())).status).toBe(400)
    expect((await GET(req('  '))).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('proxies the backend search and unwraps data', async () => {
    const data = [
      { symbol: 'SXR8.DE', name: 'iShares Core S&P 500 UCITS ETF USD (Acc)', exchange: 'XETRA' },
    ]
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data })))

    const res = await GET(req(' S&P 500 '))

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/tickers/search?q=S%26P+500')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(data)
    expect(res.headers.get('cache-control')).toContain('s-maxage')
  })

  it('returns 502 when the backend errors', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 502 }))
    expect((await GET(req('SXR8'))).status).toBe(502)
  })

  it('returns 502 when the backend is unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    expect((await GET(req('SXR8'))).status).toBe(502)
  })
})
