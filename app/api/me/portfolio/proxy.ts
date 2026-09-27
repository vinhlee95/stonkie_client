import { NextResponse } from 'next/server'
import { authedBackendFetch } from '@/lib/auth/server'
import { UnauthenticatedError } from '@/lib/auth/shared'

/** Forward a request to the backend with the user's JWT, passing status + JSON body through. */
export async function proxyToBackend(path: string, init: RequestInit = {}): Promise<NextResponse> {
  let response: Response
  try {
    response = await authedBackendFetch(path, init)
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 })
  }

  if (response.status === 204) return new NextResponse(null, { status: 204 })
  const body = await response.json().catch(() => ({ error: 'Invalid backend response' }))
  return NextResponse.json(body, {
    status: response.status,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
