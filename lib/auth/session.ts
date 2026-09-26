import type { Session } from 'next-auth'

type CompleteSessionUser = Session['user'] & { googleSub: string; email: string }

// Everything that needs a signed-in user (backend calls, login redirect, account menu) uses this
// one check, so a partial session is consistently treated as signed out.
export function isCompleteSessionUser(
  user: Session['user'] | null | undefined,
): user is CompleteSessionUser {
  return Boolean(user?.googleSub && user.email)
}
