import { describe, expect, it } from 'vitest'
import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import { applyProfileToToken, applyTokenToSession } from '@/lib/auth/callbacks'

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
