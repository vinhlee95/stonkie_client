// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/server', () => ({ authedBackendFetch: vi.fn() }))

import { authedBackendFetch } from '@/lib/auth/server'
import { UnauthenticatedError } from '@/lib/auth/shared'
import { GET } from '../route'
import { DELETE, PUT } from '../holdings/[ticker]/route'

const backend = authedBackendFetch as unknown as ReturnType<typeof vi.fn>
const ctx = (ticker: string) => ({ params: Promise.resolve({ ticker }) })

beforeEach(() => vi.clearAllMocks())

describe('portfolio BFF routes', () => {
  it('GET passes backend body and status through', async () => {
    backend.mockResolvedValue(new Response(JSON.stringify({ holdings: [] }), { status: 200 }))
    const res = await GET()
    expect(backend).toHaveBeenCalledWith('/api/me/portfolio', {})
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ holdings: [] })
    expect(res.headers.get('cache-control')).toBe('private, no-store')
  })

  it('returns 401 without a session', async () => {
    backend.mockRejectedValue(new UnauthenticatedError())
    expect((await GET()).status).toBe(401)
  })

  it('returns 502 when backend unreachable', async () => {
    backend.mockRejectedValue(new TypeError('fetch failed'))
    expect((await GET()).status).toBe(502)
  })

  it('PUT upper-cases ticker and forwards body + 422', async () => {
    backend.mockResolvedValue(
      new Response(JSON.stringify({ detail: 'No price data' }), { status: 422 }),
    )
    const req = new NextRequest('http://x/api/me/portfolio/holdings/nokia.he', {
      method: 'PUT',
      body: JSON.stringify({ shares: 1, avg_cost: 2 }),
    })
    const res = await PUT(req, ctx('nokia.he'))
    const [path, init] = backend.mock.calls[0]
    expect(path).toBe('/api/me/portfolio/holdings/NOKIA.HE')
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body)).toEqual({ shares: 1, avg_cost: 2 })
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ detail: 'No price data' })
  })

  it('rejects invalid tickers without calling backend', async () => {
    const res = await DELETE(new NextRequest('http://x', { method: 'DELETE' }), ctx('../me'))
    expect(res.status).toBe(400)
    expect(backend).not.toHaveBeenCalled()
  })

  it('DELETE passes 204 through', async () => {
    backend.mockResolvedValue(new Response(null, { status: 204 }))
    const res = await DELETE(new NextRequest('http://x', { method: 'DELETE' }), ctx('AAPL'))
    expect(res.status).toBe(204)
  })
})
