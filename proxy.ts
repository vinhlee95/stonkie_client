import { auth } from '@/auth'
import { loginRedirectFor } from '@/lib/auth/server'

export default auth((req) => loginRedirectFor(req, !!req.auth))

export const config = {
  matcher: ['/portfolio/:path*'],
}
