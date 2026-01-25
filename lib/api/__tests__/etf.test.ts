import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { getETFByTicker } from '../etf'
import { ETFFundamental } from '@/types/etf'

// Mock fetch globally
const originalFetch = globalThis.fetch

// Mock ETF response data matching backend schema
const mockETFResponse: ETFFundamental = {
  isin: 'IE00B5BMR087',
  ticker: 'SXR8',
  name: 'iShares Core S&P 500 UCITS ETF USD (Acc)',
  fund_provider: 'iShares',
  fund_size_billions: 114.617,
  ter_percent: 0.07,
  replication_method: 'Physical (Full replication)',
  distribution_policy: 'Accumulating',
  fund_currency: 'USD',
  domicile: 'IE',
  launch_date: '2010-05-19',
  index_tracked: 'S&P 500',
  holdings: [
    { name: 'NVIDIA Corp.', weight_percent: 7.38 },
    { name: 'Apple', weight_percent: 7.07 },
    { name: 'Microsoft', weight_percent: 6.25 },
    { name: 'Amazon', weight_percent: 3.94 },
    { name: 'Alphabet (Class A)', weight_percent: 1.94 },
    { name: 'Meta Platforms', weight_percent: 1.88 },
    { name: 'Alphabet (Class C)', weight_percent: 1.65 },
    { name: 'Broadcom', weight_percent: 1.48 },
    { name: 'Tesla', weight_percent: 1.42 },
    { name: 'Berkshire Hathaway', weight_percent: 1.4 },
  ],
  sector_allocation: [
    { sector: 'Technology', weight_percent: 36.15 },
    { sector: 'Financials', weight_percent: 10.66 },
    { sector: 'Telecommunication', weight_percent: 10.63 },
    { sector: 'Consumer Discretionary', weight_percent: 10.36 },
    { sector: 'Other', weight_percent: 32.2 },
  ],
  country_allocation: [
    { country: 'United States', weight_percent: 95.83 },
    { country: 'Ireland', weight_percent: 1.32 },
    { country: 'Other', weight_percent: 2.85 },
  ],
  source_url: null,
  created_at: '2026-01-25T13:28:10.465852+00:00',
  updated_at: '2026-01-25T13:28:10.465852+00:00',
}

describe('getETFByTicker', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    globalThis.fetch = originalFetch
  })

  afterEach(() => {
    // Restore original fetch after each test
    globalThis.fetch = originalFetch
  })

  it('should successfully fetch ETF data for valid ticker (SXR8)', async () => {
    globalThis.fetch = (async () => {
      return {
        ok: true,
        status: 200,
        json: async () => mockETFResponse,
      } as unknown as Response
    }) as typeof fetch

    const result = await getETFByTicker('SXR8')

    assert.deepStrictEqual(result, mockETFResponse)
    assert.strictEqual(result.ticker, 'SXR8')
    assert.strictEqual(result.name, 'iShares Core S&P 500 UCITS ETF USD (Acc)')
    assert.strictEqual(result.holdings.length, 10)
    assert.strictEqual(result.sector_allocation.length, 5)
    assert.strictEqual(result.country_allocation.length, 3)
  })

  it('should throw "ETF not found" error for 404 response', async () => {
    globalThis.fetch = (async () => {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: "ETF with ticker 'NONEXISTENT' not found" }),
      } as unknown as Response
    }) as typeof fetch

    await assert.rejects(
      () => getETFByTicker('NONEXISTENT'),
      (error: Error) => {
        assert.strictEqual(error.message, 'ETF not found')
        return true
      },
    )
  })

  it('should throw error for non-404 error responses', async () => {
    globalThis.fetch = (async () => {
      return {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as unknown as Response
    }) as typeof fetch

    await assert.rejects(
      () => getETFByTicker('SXR8'),
      (error: Error) => {
        assert(error.message.includes('Failed to fetch ETF: 500 Internal Server Error'))
        return true
      },
    )
  })

  it('should throw timeout error when request exceeds 5s', async () => {
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      // Simulate a delay longer than timeout
      // Check if AbortSignal is provided and respect it
      const signal = init?.signal as AbortSignal | undefined
      if (signal) {
        // Wait a bit, then check if aborted
        await new Promise((resolve) => setTimeout(resolve, 100))
        if (signal.aborted) {
          throw new DOMException('The operation was aborted.', 'AbortError')
        }
        // Continue waiting beyond timeout
        await new Promise((resolve) => setTimeout(resolve, 6000))
        if (signal.aborted) {
          throw new DOMException('The operation was aborted.', 'AbortError')
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 6000))
      }
      return {
        ok: true,
        status: 200,
        json: async () => mockETFResponse,
      } as unknown as Response
    }) as typeof fetch

    await assert.rejects(
      () => getETFByTicker('SXR8'),
      (error: Error) => {
        assert.strictEqual(error.message, 'Request timeout')
        return true
      },
    )
  })

  it('should throw network error for fetch failures', async () => {
    globalThis.fetch = (async () => {
      throw new Error('Network request failed')
    }) as typeof fetch

    await assert.rejects(
      () => getETFByTicker('SXR8'),
      (error: Error) => {
        assert(error.message.includes('Network error: Network request failed'))
        return true
      },
    )
  })

  it('should throw error for invalid JSON response', async () => {
    globalThis.fetch = (async () => {
      return {
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Unexpected token')
        },
      } as unknown as Response
    }) as typeof fetch

    await assert.rejects(
      () => getETFByTicker('SXR8'),
      (error: Error) => {
        assert.strictEqual(error.message, 'Invalid JSON response from server')
        return true
      },
    )
  })

  it('should handle empty ticker string', async () => {
    await assert.rejects(
      () => getETFByTicker(''),
      (error: Error) => {
        assert.strictEqual(error.message, 'Ticker symbol is required')
        return true
      },
    )

    await assert.rejects(
      () => getETFByTicker('   '),
      (error: Error) => {
        assert.strictEqual(error.message, 'Ticker symbol is required')
        return true
      },
    )
  })

  it('should validate response data matches ETFFundamental type', async () => {
    globalThis.fetch = (async () => {
      return {
        ok: true,
        status: 200,
        json: async () => mockETFResponse,
      } as unknown as Response
    }) as typeof fetch

    const result = await getETFByTicker('SXR8')

    // Type validation - ensure all required fields are present
    assert('isin' in result)
    assert('ticker' in result)
    assert('name' in result)
    assert('fund_provider' in result)
    assert('ter_percent' in result)
    assert('holdings' in result)
    assert('sector_allocation' in result)
    assert('country_allocation' in result)

    // Validate nested structures
    assert(Array.isArray(result.holdings))
    assert(Array.isArray(result.sector_allocation))
    assert(Array.isArray(result.country_allocation))

    // Validate holding structure
    if (result.holdings.length > 0) {
      assert('name' in result.holdings[0])
      assert('weight_percent' in result.holdings[0])
    }
  })

  it('should handle SPYY ticker successfully', async () => {
    const mockSPYYResponse: ETFFundamental = {
      ...mockETFResponse,
      ticker: 'SPYY',
      isin: 'IE00B44Z5B48',
      name: 'SPDR MSCI All Country World UCITS ETF (Acc)',
      fund_provider: 'SPDR ETF',
    }

    globalThis.fetch = (async () => {
      return {
        ok: true,
        status: 200,
        json: async () => mockSPYYResponse,
      } as Response
    }) as typeof fetch

    const result = await getETFByTicker('SPYY')

    assert.strictEqual(result.ticker, 'SPYY')
    assert.strictEqual(result.name, 'SPDR MSCI All Country World UCITS ETF (Acc)')
    assert.strictEqual(result.fund_provider, 'SPDR ETF')
  })

  it('should handle case-insensitive ticker input', async () => {
    globalThis.fetch = (async () => {
      return {
        ok: true,
        status: 200,
        json: async () => mockETFResponse,
      } as unknown as Response
    }) as typeof fetch

    // Backend normalizes to uppercase, so lowercase input should work
    const result = await getETFByTicker('sxr8')
    assert.strictEqual(result.ticker, 'SXR8')
  })
})
