// Lives under app/ because vitest excludes **/lib/**.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  addLot,
  deleteLot,
  fetchPortfolio,
  removeHolding,
  updateLot,
} from '@/lib/api/portfolio'

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
    await expect(
      addLot('NOPE', { shares: 1, price: 1, purchased_on: null, name: null }),
    ).rejects.toThrow('No price data for NOPE')
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

  it('sends lot writes to the BFF', async () => {
    fetchMock.mockImplementation(async () => new Response(null, { status: 204 }))
    const id = '0b8a3f1e-5d2c-4c3a-9f1e-2b7d8c9a0e11'

    await addLot('BRK-B', { shares: 1, price: 410, purchased_on: null, name: 'Berkshire' })
    await updateLot(id, { shares: 2, price: 400, purchased_on: '2025-01-02' })
    await deleteLot(id)

    const json = { 'Content-Type': 'application/json' }
    expect(fetchMock.mock.calls).toEqual([
      [
        '/api/me/portfolio/holdings/BRK-B/lots',
        {
          method: 'POST',
          headers: json,
          body: JSON.stringify({ shares: 1, price: 410, purchased_on: null, name: 'Berkshire' }),
        },
      ],
      [
        `/api/me/portfolio/lots/${id}`,
        {
          method: 'PATCH',
          headers: json,
          body: JSON.stringify({ shares: 2, price: 400, purchased_on: '2025-01-02' }),
        },
      ],
      [`/api/me/portfolio/lots/${id}`, { method: 'DELETE' }],
    ])
  })

  it('surfaces lot write errors', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: 'A holding is limited to 100 lots' }), { status: 409 }),
    )
    await expect(
      addLot('AAPL', { shares: 1, price: 1, purchased_on: null, name: null }),
    ).rejects.toThrow('A holding is limited to 100 lots')
  })
})
