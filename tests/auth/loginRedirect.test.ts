// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { loginRedirectFor } from '@/lib/auth/loginRedirect'

describe('loginRedirectFor', () => {
  it('redirects unauthenticated requests to /login with callbackUrl', () => {
    const response = loginRedirectFor(
      new NextRequest('http://localhost:3000/portfolio/x?y=1'),
      false,
    )

    expect(response?.status).toBe(307)
    const location = new URL(response!.headers.get('location')!)
    expect(location.pathname).toBe('/login')
    expect(location.searchParams.get('callbackUrl')).toBe('/portfolio/x?y=1')
  })

  it('lets authenticated requests through', () => {
    expect(
      loginRedirectFor(new NextRequest('http://localhost:3000/portfolio'), true),
    ).toBeUndefined()
  })
})
