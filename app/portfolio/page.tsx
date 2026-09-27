import { redirect } from 'next/navigation'
import { authedBackendFetch } from '@/lib/auth/server'
import { UnauthenticatedError } from '@/lib/auth/shared'
import type { Portfolio } from '@/lib/api/portfolio'
import PortfolioDashboard from './components/PortfolioDashboard'

export const dynamic = 'force-dynamic'

type LoadResult =
  | { status: 'ok'; portfolio: Portfolio }
  | { status: 'unauthenticated' }
  | { status: 'error' }

async function loadPortfolio(): Promise<LoadResult> {
  try {
    const res = await authedBackendFetch('/api/me/portfolio')
    if (!res.ok) return { status: 'error' }
    return { status: 'ok', portfolio: (await res.json()) as Portfolio }
  } catch (error) {
    if (error instanceof UnauthenticatedError) return { status: 'unauthenticated' }
    return { status: 'error' }
  }
}

export default async function PortfolioPage() {
  const result = await loadPortfolio()
  // redirect() throws, so call it outside the try/catch above.
  if (result.status === 'unauthenticated') redirect('/login?callbackUrl=%2Fportfolio')

  if (result.status === 'error') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Portfolio</h1>
        <p role="alert" className="mt-2 text-base text-red-600 md:text-lg">
          Couldn&apos;t load your portfolio. Please try again later.
        </p>
      </main>
    )
  }

  return <PortfolioDashboard initialData={result.portfolio} />
}
