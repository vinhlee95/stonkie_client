// Lives under app/ because vitest excludes **/lib/**.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fetchPortfolio, removeHolding, saveHolding } from '@/lib/api/portfolio'

const fetchMock = vi.fn()
beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('portfolio API errors', () => {
  it('falls back to the status code for a non-JSON error body', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 500 }))
    await expect(fetchPortfolio()).rejects.toThrow('Request failed (500)')
  })

  it('surfaces the backend detail or BFF error message', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'No price data for NOPE' }), { status: 422 }),
    )
    await expect(saveHolding('NOPE', { shares: 1, avg_cost: 1 })).rejects.toThrow(
      'No price data for NOPE',
    )
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    )
    await expect(removeHolding('AAPL')).rejects.toThrow('Unauthorized')
  })

  it('ignores a JSON body without a string message', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: [{ msg: 'x' }] }), { status: 422 }),
    )
    await expect(fetchPortfolio()).rejects.toThrow('Request failed (422)')
  })
})
