import { NextResponse } from 'next/server'
import { authedBackendFetch } from '@/lib/auth/server'
import { UnauthenticatedError } from '@/lib/auth/shared'

const NO_STORE = { 'Cache-Control': 'private, no-store' }

/** The backend response, or the 401/502 to return when it couldn't be reached as this user. */
async function fetchAsUser(path: string, init: RequestInit): Promise<Response | NextResponse> {
  try {
    return await authedBackendFetch(path, init)
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 })
  }
}

async function passJson(response: Response): Promise<NextResponse> {
  if (response.status === 204) return new NextResponse(null, { status: 204, headers: NO_STORE })
  const body = await response.json().catch(() => ({ error: 'Invalid backend response' }))
  return NextResponse.json(body, { status: response.status, headers: NO_STORE })
}

/** Forward a request to the backend with the user's JWT, passing status + JSON body through. */
export async function proxyToBackend(path: string, init: RequestInit = {}): Promise<NextResponse> {
  const response = await fetchAsUser(path, init)
  if (response instanceof NextResponse) return response
  return passJson(response)
}

/**
 * Like proxyToBackend, but a 2xx body is streamed through unbuffered (chat answers).
 * Errors still come back as JSON with their status.
 */
export async function streamFromBackend(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetchAsUser(path, init)
  if (response instanceof NextResponse) return response
  if (!response.ok || !response.body) return passJson(response)
  return new Response(response.body, {
    status: response.status,
    headers: { ...NO_STORE, 'Content-Type': 'text/event-stream' },
  })
}
