// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/server', () => ({ authedBackendFetch: vi.fn() }))

import { authedBackendFetch } from '@/lib/auth/server'
import { UnauthenticatedError } from '@/lib/auth/shared'
import { POST } from '../chat/route'

const backend = authedBackendFetch as unknown as ReturnType<typeof vi.fn>
const body = '{"question":"Why is TSLA down?","scopeTicker":"TSLA"}'
const request = () => new NextRequest('http://x/api/me/portfolio/chat', { method: 'POST', body })

beforeEach(() => vi.clearAllMocks())

describe('portfolio chat BFF route', () => {
  it('streams the backend body through with the request body and abort signal', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"type":"answer","body":"Hi"}\n\n'))
        controller.close()
      },
    })
    backend.mockResolvedValue(new Response(stream, { status: 200 }))
    const req = request()

    const res = await POST(req)

    const [path, init] = backend.mock.calls[0]
    expect(path).toBe('/api/me/portfolio/chat')
    expect(init).toMatchObject({ method: 'POST', body })
    expect(init.signal).toBe(req.signal)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/event-stream')
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(await res.text()).toBe('{"type":"answer","body":"Hi"}\n\n')
  })

  it('returns 401 without a session', async () => {
    backend.mockRejectedValue(new UnauthenticatedError())
    expect((await POST(request())).status).toBe(401)
  })

  it('returns 502 when the backend is unreachable', async () => {
    backend.mockRejectedValue(new TypeError('fetch failed'))
    expect((await POST(request())).status).toBe(502)
  })

  it('passes backend errors through as JSON', async () => {
    backend.mockResolvedValue(
      new Response(JSON.stringify({ detail: 'TSLA is not in your portfolio' }), { status: 422 }),
    )
    const res = await POST(request())
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ detail: 'TSLA is not in your portfolio' })
  })
})
