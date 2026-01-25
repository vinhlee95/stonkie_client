import { notFound } from 'next/navigation'
import { getETFByTicker } from '@/lib/api/etf'
import type { Metadata } from 'next'

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
  } catch (error) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-4">{etf.name}</h1>
      <p className="text-muted-foreground mb-6">
        ETF data will be displayed here. Components coming in Phase 3-6.
      </p>
      {/* ETFOverview component will be added in Phase 3 */}
      {/* HoldingsTable component will be added in Phase 4 */}
      {/* SectorAllocationChart component will be added in Phase 5 */}
      {/* CountryAllocationChart component will be added in Phase 6 */}
    </div>
  )
}
