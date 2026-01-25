import { notFound } from 'next/navigation'
import { getETFByTicker } from '@/lib/api/etf'
import type { Metadata } from 'next'
import ETFOverview from '@/app/components/etf/ETFOverview'
import HoldingsTable from '@/app/components/etf/HoldingsTable'

export const revalidate = 120 // Revalidate every 2 minutes

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>
}): Promise<Metadata> {
  const { ticker } = await params
  const normalizedTicker = ticker.toUpperCase()

  try {
    const etf = await getETFByTicker(normalizedTicker)
    return {
      title: `${etf.name} (${normalizedTicker}) - ETF Analysis | Stonkie`,
      description: `Comprehensive analysis of ${etf.name} including holdings, sector allocation, and key metrics.`,
    }
  } catch {
    return {
      title: 'ETF Not Found | Stonkie',
    }
  }
}

export default async function ETFPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params
  const normalizedTicker = ticker.toUpperCase()

  let etf
  try {
    etf = await getETFByTicker(normalizedTicker)
  } catch {
    notFound()
  }

  return (
    <>
      <ETFOverview etf={etf} />
      <HoldingsTable holdings={etf.holdings} />
      {/* SectorAllocationChart component will be added in Phase 5 */}
      {/* CountryAllocationChart component will be added in Phase 6 */}
    </>
  )
}
