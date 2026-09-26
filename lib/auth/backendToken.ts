import { SignJWT } from 'jose'

export const BACKEND_TOKEN_ISSUER = 'stonkie-web'
export const BACKEND_TOKEN_AUDIENCE = 'stonkie-api'
export const BACKEND_TOKEN_TTL_SECONDS = 300
const MIN_SECRET_BYTES = 32

export type BackendTokenUser = {
  googleSub: string
  email: string
  name?: string | null
  image?: string | null
}

export async function mintBackendToken(
  user: BackendTokenUser,
  secret: string | undefined = process.env.BACKEND_JWT_SECRET,
): Promise<string> {
  const key = new TextEncoder().encode(secret ?? '')
  if (key.length < MIN_SECRET_BYTES) {
    throw new Error('BACKEND_JWT_SECRET missing or shorter than 32 bytes')
  }

  const claims: Record<string, string> = { email: user.email }
  if (user.name) claims.name = user.name
  if (user.image) claims.picture = user.image

  const now = Math.floor(Date.now() / 1000)
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.googleSub)
    .setIssuer(BACKEND_TOKEN_ISSUER)
    .setAudience(BACKEND_TOKEN_AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + BACKEND_TOKEN_TTL_SECONDS)
    .sign(key)
}
