import { describe, expect, it } from 'vitest'
import { isCompleteSessionUser } from '@/lib/auth/session'

describe('isCompleteSessionUser', () => {
  it('requires both googleSub and email', () => {
    expect(isCompleteSessionUser({ googleSub: 'g-1', email: 'a@example.com' })).toBe(true)
    expect(isCompleteSessionUser({ email: 'a@example.com' })).toBe(false)
    expect(isCompleteSessionUser({ googleSub: 'g-1' })).toBe(false)
    expect(isCompleteSessionUser(null)).toBe(false)
    expect(isCompleteSessionUser(undefined)).toBe(false)
  })
})
