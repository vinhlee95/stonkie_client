// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { jwtVerify } from 'jose'
import { BACKEND_TOKEN_TTL_SECONDS, mintBackendToken } from '@/lib/auth/backendToken'

const SECRET = 's'.repeat(32)
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
