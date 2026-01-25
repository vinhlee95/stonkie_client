import { notFound } from 'next/navigation'
import Link from 'next/link'
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
    <div className="container mx-auto py-6">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <li>
            <Link
              href="/"
              className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <span className="text-gray-900 dark:text-gray-200">ETF</span>
          </li>
          <li>/</li>
          <li>
            <span className="text-gray-900 dark:text-gray-200">{normalizedTicker}</span>
          </li>
        </ol>
      </nav>

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
