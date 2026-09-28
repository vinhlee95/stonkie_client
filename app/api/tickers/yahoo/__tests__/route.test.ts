// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'

const fetchMock = vi.fn()
const req = (q?: string) =>
  new NextRequest(`http://localhost/api/tickers/yahoo${q === undefined ? '' : `?q=${q}`}`)

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('GET /api/tickers/yahoo', () => {
  it('returns 400 without q', async () => {
    expect((await GET(req())).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps holdable Yahoo quotes with exchange suffixes', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          quotes: [
            {
              symbol: 'SXR8.DE',
              shortname: 'iShs VII-Core S&P 500',
              longname: 'iShares Core S&P 500 UCITS ETF USD (Acc)',
              quoteType: 'ETF',
              exchDisp: 'XETRA',
              isYahooFinance: true,
            },
            {
              symbol: 'AAPL',
              shortname: 'Apple Inc.',
              quoteType: 'EQUITY',
              exchDisp: 'NASDAQ',
              isYahooFinance: true,
            },
            { symbol: '^GSPC', shortname: 'S&P 500', quoteType: 'INDEX', isYahooFinance: true },
            {
              symbol: 'XYZ',
              shortname: 'Not on Yahoo',
              quoteType: 'EQUITY',
              isYahooFinance: false,
            },
          ],
        }),
      ),
    )

    const res = await GET(req('SXR8'))

    expect(fetchMock.mock.calls[0][0]).toContain(
      'query2.finance.yahoo.com/v1/finance/search?q=SXR8',
    )
    expect(await res.json()).toEqual([
      { symbol: 'SXR8.DE', name: 'iShares Core S&P 500 UCITS ETF USD (Acc)', exchange: 'XETRA' },
      { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
    ])
  })

  it('returns 502 on upstream error', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 429 }))
    expect((await GET(req('SXR8'))).status).toBe(502)
  })

  it('returns 502 when fetch throws', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    expect((await GET(req('SXR8'))).status).toBe(502)
  })
})
