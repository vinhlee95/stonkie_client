import { describe, expect, it } from 'vitest'
import { DEFAULT_CALLBACK_URL, sanitizeCallbackUrl } from '@/lib/auth/callbackUrl'

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
