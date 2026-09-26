import type { Profile, Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

export function applyProfileToToken(token: JWT, profile?: Profile | null): JWT {
  if (profile?.sub) token.googleSub = profile.sub
  return token
}

export function applyTokenToSession(session: Session, token: JWT): Session {
  if (token.googleSub) session.user.googleSub = token.googleSub
  return session
}
