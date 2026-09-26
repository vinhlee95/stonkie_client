// Server-only: imports the Auth.js server session. Never import from client components.
import { auth } from '@/auth'
import { mintBackendToken } from './backendToken'
import { UnauthenticatedError } from './errors'

export async function authedBackendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const session = await auth()
  const user = session?.user
  if (!user?.googleSub || !user.email) throw new UnauthenticatedError()

  const token = await mintBackendToken({
    googleSub: user.googleSub,
    email: user.email,
    name: user.name,
    image: user.image,
  })
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)

  return fetch(`${process.env.BACKEND_URL}${path}`, { ...init, headers, cache: 'no-store' })
}
