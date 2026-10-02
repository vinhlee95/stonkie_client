// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/server', () => ({ authedBackendFetch: vi.fn() }))

import { authedBackendFetch } from '@/lib/auth/server'
import { UnauthenticatedError } from '@/lib/auth/shared'
import { GET } from '../route'
import * as holdingRoute from '../holdings/[ticker]/route'
import { POST as POST_LOT } from '../holdings/[ticker]/lots/route'
import { DELETE as DELETE_LOT, PATCH as PATCH_LOT } from '../lots/[lotId]/route'

const backend = authedBackendFetch as unknown as ReturnType<typeof vi.fn>
const ctx = (ticker: string) => ({ params: Promise.resolve({ ticker }) })
const lotCtx = (lotId: string) => ({ params: Promise.resolve({ lotId }) })

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

  it('rejects invalid tickers without calling backend', async () => {
    const res = await holdingRoute.DELETE(new NextRequest('http://x', { method: 'DELETE' }), ctx('../me'))
    expect(res.status).toBe(400)
    expect(backend).not.toHaveBeenCalled()
  })

  it('maps a non-JSON backend body to an error payload, keeping status', async () => {
    backend.mockResolvedValue(new Response('<html>oops</html>', { status: 500 }))
    const res = await GET()
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Invalid backend response' })
  })

  it('DELETE passes 204 through', async () => {
    backend.mockResolvedValue(new Response(null, { status: 204 }))
    const res = await holdingRoute.DELETE(new NextRequest('http://x', { method: 'DELETE' }), ctx('AAPL'))
    expect(res.status).toBe(204)
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
  })

  it('POST lots upper-cases ticker and forwards body', async () => {
    backend.mockResolvedValue(new Response(JSON.stringify({ id: 'x' }), { status: 201 }))
    const body = { shares: 1, price: 2, purchased_on: null, name: null }
    const req = new NextRequest('http://x', { method: 'POST', body: JSON.stringify(body) })
    const res = await POST_LOT(req, ctx('nokia.he'))
    const [path, init] = backend.mock.calls[0]
    expect(path).toBe('/api/me/portfolio/holdings/NOKIA.HE/lots')
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(init.body)).toEqual(body)
    expect(res.status).toBe(201)
  })

  it('POST lots rejects invalid tickers without calling backend', async () => {
    const res = await POST_LOT(
      new NextRequest('http://x', { method: 'POST', body: '{}' }),
      ctx('../me'),
    )
    expect(res.status).toBe(400)
    expect(backend).not.toHaveBeenCalled()
  })

  it('PATCH and DELETE lot forward to the lot path', async () => {
    const id = '0B8A3F1E-5D2C-4C3A-9F1E-2B7D8C9A0E11'
    backend.mockResolvedValueOnce(new Response(JSON.stringify({ id }), { status: 200 }))
    backend.mockResolvedValueOnce(new Response(null, { status: 204 }))

    const patch = await PATCH_LOT(
      new NextRequest('http://x', { method: 'PATCH', body: '{"shares":2}' }),
      lotCtx(id),
    )
    const del = await DELETE_LOT(new NextRequest('http://x', { method: 'DELETE' }), lotCtx(id))

    expect(backend.mock.calls[0][0]).toBe(`/api/me/portfolio/lots/${id.toLowerCase()}`)
    expect(backend.mock.calls[0][1]).toMatchObject({ method: 'PATCH', body: '{"shares":2}' })
    expect(backend.mock.calls[1]).toEqual([
      `/api/me/portfolio/lots/${id.toLowerCase()}`,
      { method: 'DELETE' },
    ])
    expect(patch.status).toBe(200)
    expect(del.status).toBe(204)
  })

  it.each(['../holdings', 'not-a-uuid', '0b8a3f1e-5d2c-4c3a-9f1e-2b7d8c9a0e1'])(
    'rejects lot id %j without calling backend',
    async (lotId) => {
      const res = await DELETE_LOT(
        new NextRequest('http://x', { method: 'DELETE' }),
        lotCtx(lotId),
      )
      expect(res.status).toBe(400)
      expect(backend).not.toHaveBeenCalled()
    },
  )

  it('no longer exposes PUT for holdings', () => {
    expect('PUT' in holdingRoute).toBe(false)
  })
})
