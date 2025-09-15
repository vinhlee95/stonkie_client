import { AnnualFiling } from '@/app/types'
import FinancialPeriodTabWithRouterChange from '@/app/components/FinancialPeriodTabWithRouterChange'
import FilingCards from './FilingCards'
import { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>
}): Promise<Metadata> {
  const { ticker } = await params

  return {
    title: `${ticker.toUpperCase()} - 10K filings - Stonkie`,
  }
}

export default async function FilingPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>
  searchParams: Promise<{ period?: string }>
}) {
  const { ticker } = await params
  const { period } = await searchParams

  const selectedPeriod = period === 'quarterly' ? 'quarterly' : 'annual'

  // Fetch annual filings
  const annualFilingsResponse = await fetch(
    `${process.env.BACKEND_URL}/api/companies/${ticker.toLowerCase()}/filings/annual`,
    {
      next: { revalidate: 15 * 60 },
    },
  )

  // Fetch quarterly filings
  const quarterlyFilingsResponse = await fetch(
    `${process.env.BACKEND_URL}/api/companies/${ticker.toLowerCase()}/filings/quarter`,
    {
      next: { revalidate: 15 * 60 },
    },
  )

  const annualFilings: AnnualFiling[] =
    annualFilingsResponse.status === 200 ? await annualFilingsResponse.json() : []

  const quarterlyFilings: AnnualFiling[] =
    quarterlyFilingsResponse.status === 200 ? await quarterlyFilingsResponse.json() : []

  return (
    <div>
      {/* Tab Navigation */}
      <FinancialPeriodTabWithRouterChange />

      {/* Filing Count */}
      <div className="text-right mb-4">
        {selectedPeriod === 'quarterly' ? quarterlyFilings.length : annualFilings.length} filings
        available
      </div>

      <FilingCards
        annualFilings={annualFilings}
        quarterlyFilings={quarterlyFilings}
        selectedPeriod={selectedPeriod}
      />
    </div>
  )
}
