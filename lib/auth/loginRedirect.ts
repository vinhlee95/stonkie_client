import { NextResponse, type NextRequest } from 'next/server'

export function loginRedirectFor(
  req: NextRequest,
  isAuthenticated: boolean,
): NextResponse | undefined {
  if (isAuthenticated) return undefined
  const url = new URL('/login', req.nextUrl.origin)
  url.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search)
  return NextResponse.redirect(url)
}
