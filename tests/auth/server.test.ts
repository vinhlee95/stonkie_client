// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { jwtVerify } from 'jose'
import { NextRequest } from 'next/server'

vi.mock('@/auth', () => ({ auth: vi.fn() }))

import { auth } from '@/auth'
import {
  authedBackendFetch,
  BACKEND_TOKEN_TTL_SECONDS,
  loginRedirectFor,
  mintBackendToken,
} from '@/lib/auth/server'
import { UnauthenticatedError } from '@/lib/auth/shared'

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

const key = new TextEncoder().encode(SECRET)

describe('mintBackendToken', () => {
  it('signs the contract claims', async () => {
    const token = await mintBackendToken(
      { googleSub: 'g-1', email: 'a@example.com', name: 'Ann', image: 'https://img/a.png' },
      SECRET,
    )
    const { payload, protectedHeader } = await jwtVerify(token, key, {
      issuer: 'stonkie-web',
      audience: 'stonkie-api',
    })

    expect(protectedHeader.alg).toBe('HS256')
    expect(payload).toMatchObject({
      sub: 'g-1',
      email: 'a@example.com',
      name: 'Ann',
      picture: 'https://img/a.png',
    })
    expect(payload.exp! - payload.iat!).toBe(BACKEND_TOKEN_TTL_SECONDS)
  })

  it('omits name and picture when absent', async () => {
    const token = await mintBackendToken(
      { googleSub: 'g-1', email: 'a@example.com', name: null },
      SECRET,
    )
    const { payload } = await jwtVerify(token, key)

    expect(payload).not.toHaveProperty('name')
    expect(payload).not.toHaveProperty('picture')
  })

  it('throws when secret is missing or short', async () => {
    await expect(mintBackendToken({ googleSub: 'g', email: 'e' }, '')).rejects.toThrow(
      'BACKEND_JWT_SECRET',
    )
    await expect(mintBackendToken({ googleSub: 'g', email: 'e' }, 'short')).rejects.toThrow(
      'BACKEND_JWT_SECRET',
    )
  })
})

describe('loginRedirectFor', () => {
  it.each([
    ['no session', null],
    ['session without googleSub', { email: 'a@example.com' }],
    ['session without email', { googleSub: 'g-1' }],
  ])('redirects to /login with callbackUrl for %s', (_label, user) => {
    const response = loginRedirectFor(
      new NextRequest('http://localhost:3000/portfolio/x?y=1'),
      user,
    )

    expect(response?.status).toBe(307)
    const location = new URL(response!.headers.get('location')!)
    expect(location.pathname).toBe('/login')
    expect(location.searchParams.get('callbackUrl')).toBe('/portfolio/x?y=1')
  })

  it('lets complete sessions through', () => {
    expect(
      loginRedirectFor(new NextRequest('http://localhost:3000/portfolio'), {
        googleSub: 'g-1',
        email: 'a@example.com',
      }),
    ).toBeUndefined()
  })
})
