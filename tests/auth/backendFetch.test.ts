// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { jwtVerify } from 'jose'

vi.mock('@/auth', () => ({ auth: vi.fn() }))

import { auth } from '@/auth'
import { authedBackendFetch } from '@/lib/auth/backendFetch'
import { UnauthenticatedError } from '@/lib/auth/errors'

const SECRET = 's'.repeat(32)
const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>
const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubEnv('BACKEND_JWT_SECRET', SECRET)
  vi.stubEnv('BACKEND_URL', 'http://backend.test')
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockResolvedValue(new Response('{}'))
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('authedBackendFetch', () => {
  it('calls backend with a verified bearer token', async () => {
    mockedAuth.mockResolvedValue({
      user: { googleSub: 'g-1', email: 'a@example.com', name: 'Ann' },
      expires: '',
    })

    await authedBackendFetch('/api/me', { headers: { 'X-Test': '1' } })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://backend.test/api/me')
    expect(init.cache).toBe('no-store')
    const headers = new Headers(init.headers)
    expect(headers.get('X-Test')).toBe('1')
    const token = headers.get('Authorization')!.replace('Bearer ', '')
    const { payload } = await jwtVerify(token, new TextEncoder().encode(SECRET))
    expect(payload.sub).toBe('g-1')
  })

  it.each([
    null,
    { user: { email: 'a@example.com' }, expires: '' },
    { user: { googleSub: 'g-1' }, expires: '' },
  ])('throws UnauthenticatedError for session %j', async (session) => {
    mockedAuth.mockResolvedValue(session)

    await expect(authedBackendFetch('/api/me')).rejects.toBeInstanceOf(UnauthenticatedError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
