import { describe, expect, it } from 'vitest'
import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import {
  applyProfileToToken,
  applyTokenToSession,
  DEFAULT_CALLBACK_URL,
  isCompleteSessionUser,
  sanitizeCallbackUrl,
} from '@/lib/auth/shared'

describe('isCompleteSessionUser', () => {
  it('requires both googleSub and email', () => {
    expect(isCompleteSessionUser({ googleSub: 'g-1', email: 'a@example.com' })).toBe(true)
    expect(isCompleteSessionUser({ email: 'a@example.com' })).toBe(false)
    expect(isCompleteSessionUser({ googleSub: 'g-1' })).toBe(false)
    expect(isCompleteSessionUser(null)).toBe(false)
    expect(isCompleteSessionUser(undefined)).toBe(false)
  })
})

describe('sanitizeCallbackUrl', () => {
  it.each(['/portfolio', '/tickers/AAPL?tab=1', '/'])('keeps same-origin path %s', (value) => {
    expect(sanitizeCallbackUrl(value)).toBe(value)
  })

  it.each([
    undefined,
    null,
    '',
    'portfolio',
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    '/\t/evil.com',
    'javascript:alert(1)',
  ])('falls back for %s', (value) => {
    expect(sanitizeCallbackUrl(value)).toBe(DEFAULT_CALLBACK_URL)
  })

  it('uses the first value of an array', () => {
    expect(sanitizeCallbackUrl(['/a', '/b'])).toBe('/a')
  })
})

describe('applyProfileToToken', () => {
  it('stores Google sub on sign-in', () => {
    expect(applyProfileToToken({} as JWT, { sub: 'g-1' }).googleSub).toBe('g-1')
  })

  it('keeps existing googleSub on later calls without profile', () => {
    expect(applyProfileToToken({ googleSub: 'g-1' } as JWT, undefined).googleSub).toBe('g-1')
  })
})

describe('applyTokenToSession', () => {
  it('exposes googleSub on session.user', () => {
    const session = { user: { email: 'a@example.com' }, expires: '' } as Session
    expect(applyTokenToSession(session, { googleSub: 'g-1' } as JWT).user.googleSub).toBe('g-1')
  })
})
