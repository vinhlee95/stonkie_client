import { notFound } from 'next/navigation'
import { getETFByTicker } from '@/lib/api/etf'
import type { Metadata } from 'next'
import ETFOverview from '@/app/components/etf/ETFOverview'
import HoldingsTable from '@/app/components/etf/HoldingsTable'
import SectorAllocationChart from '@/app/components/etf/SectorAllocationChart'
import CountryAllocationChart from '@/app/components/etf/CountryAllocationChart'

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
  } catch (error) {
    console.error(`Failed to fetch ETF metadata for ticker ${normalizedTicker}:`, error)
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
  } catch (error) {
    console.error(`Failed to fetch ETF data for ticker ${normalizedTicker}:`, error)
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      {/* ETF Overview Section */}
      <ETFOverview etf={etf} />

      {/* Top Holdings Section */}
      <HoldingsTable holdings={etf.holdings} />

      {/* Asset Allocation Section - Charts side by side */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-6">Asset Allocation</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectorAllocationChart sectorAllocation={etf.sector_allocation} />
          <CountryAllocationChart countryAllocation={etf.country_allocation} />
        </div>
      </div>
    </div>
  )
}
