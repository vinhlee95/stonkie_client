import { auth } from '@/auth'
import { loginRedirectFor } from '@/lib/auth/server'

export default auth((req) => loginRedirectFor(req, req.auth?.user))

export const config = {
  matcher: ['/portfolio/:path*'],
}
