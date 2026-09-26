import { redirect } from 'next/navigation'
import { authedBackendFetch } from '@/lib/auth/backendFetch'
import { UnauthenticatedError } from '@/lib/auth/errors'

export const dynamic = 'force-dynamic'

type Me = { id: string; email: string; name: string | null; avatar_url: string | null }

type LoadResult = { status: 'ok'; me: Me } | { status: 'unauthenticated' } | { status: 'error' }

async function loadMe(): Promise<LoadResult> {
  try {
    const res = await authedBackendFetch('/api/me')
    if (!res.ok) return { status: 'error' }
    return { status: 'ok', me: (await res.json()) as Me }
  } catch (error) {
    if (error instanceof UnauthenticatedError) return { status: 'unauthenticated' }
    return { status: 'error' }
  }
}

export default async function PortfolioPage() {
  const result = await loadMe()
  // redirect() throws, so call it outside the try/catch above.
  if (result.status === 'unauthenticated') redirect('/login?callbackUrl=%2Fportfolio')

  return (
    <main className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold">My Portfolio</h1>
      {result.status === 'error' ? (
        <p role="alert" className="mt-2 text-red-600">
          Couldn&apos;t load your account. Please try again later.
        </p>
      ) : (
        <p className="mt-2 text-base md:text-lg text-gray-600 dark:text-gray-400">
          Hi {result.me.name ?? result.me.email} — portfolio coming soon.
        </p>
      )}
    </main>
  )
}
