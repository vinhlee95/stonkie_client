// Auth helpers with no server dependencies — safe to import from client components.
import type { Profile, Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

export class UnauthenticatedError extends Error {
  constructor() {
    super('Not signed in')
    this.name = 'UnauthenticatedError'
  }
}

type CompleteSessionUser = Session['user'] & { googleSub: string; email: string }

// Everything that needs a signed-in user (backend calls, login redirect, account menu) uses this
// one check, so a partial session is consistently treated as signed out.
export function isCompleteSessionUser(
  user: Session['user'] | null | undefined,
): user is CompleteSessionUser {
  return Boolean(user?.googleSub && user.email)
}

export const DEFAULT_CALLBACK_URL = '/portfolio'

// Only same-origin absolute paths. Rejects protocol-relative (//x), backslash (/\x)
// and control chars (browsers strip tabs/newlines, turning /\t/x into //x).
export function sanitizeCallbackUrl(raw: string | string[] | null | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return DEFAULT_CALLBACK_URL
  }

  if (/[\u0000-\u001f\u007f]/.test(value)) return DEFAULT_CALLBACK_URL
  return value
}

// Auth.js callbacks: persist the Google `sub` in the JWT and expose it on the session.
export function applyProfileToToken(token: JWT, profile?: Profile | null): JWT {
  if (profile?.sub) token.googleSub = profile.sub
  return token
}

export function applyTokenToSession(session: Session, token: JWT): Session {
  if (token.googleSub) session.user.googleSub = token.googleSub
  return session
}
