'use client'
import { ETFFundamental } from '@/types/etf'
import { Wallet } from 'lucide-react'
import ETFFavouriteButton from '@/app/components/ETFFavouriteButton'
import dynamic from 'next/dynamic'

const PriceChart = dynamic(() => import('@/app/tickers/[ticker]/PriceChart'), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] mb-6">
      <div className="h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden animate-pulse flex flex-col">
        {/* Header with date range buttons */}
        <div className="flex gap-2 p-3 border-b border-gray-200 dark:border-gray-800">
          {['12M', '1W', 'YTD', 'ALL'].map((label) => (
            <div key={label} className="h-6 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 p-4 relative">
          {/* Placeholder chart line pattern */}
          <div className="absolute inset-4 flex items-end justify-between gap-1">
            {[40, 65, 45, 70, 55, 80, 60, 75, 50, 85, 70, 90].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-gray-300 dark:from-gray-700 to-gray-200 dark:to-gray-800 rounded-t"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>

          {/* Volume bars at bottom */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-1 h-8">
            {[30, 50, 40, 60, 45, 55, 50, 65, 40, 70, 55, 75].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gray-300 dark:bg-gray-700 rounded-t opacity-40"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
})

/**
 * Format fund size in billions to currency string (e.g., 114.617 -> "$114.62B")
 */
function formatFundSize(billions: number | null): string {
  if (billions === null) return 'N/A'
  return `$${billions.toFixed(2)}B`
}

/**
 * Format TER percentage (e.g., 0.07 -> "0.07%")
 */
function formatTER(ter: number): string {
  return `${ter.toFixed(2)}%`
}

/**
 * Format date string "YYYY-MM-DD" to readable format (e.g., "2010-05-19" -> "May 19, 2010")
 */
function formatLaunchDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function ETFOverview({ etf }: { etf: ETFFundamental }) {
  const etfListItem = {
    ticker: etf.ticker || '',
    name: etf.name,
    fund_provider: etf.fund_provider,
    logo_url: etf.logo_url,
  }

  return (
    <>
      {/* Header Section - matching stock page style */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 flex-shrink-0">
            {etf.logo_url ? (
              <img
                src={etf.logo_url}
                alt={`${etf.name} logo`}
                className="w-full h-full object-contain rounded-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full">
                <Wallet className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{etf.name}</h1>
            <h2 className="text-gray-600 dark:text-gray-400">
              {etf.ticker || 'N/A'}
              {etf.isin && ` • ISIN: ${etf.isin}`}
            </h2>
          </div>
        </div>
        {etf.ticker && (
          <div className="ml-4">
            <ETFFavouriteButton etf={etfListItem} />
          </div>
        )}
      </div>

      {/* Price Chart */}
      <PriceChart ticker={etf.ticker || ''} />

      {/* Key Metrics Grid - using stat-card class like stock page */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="stat-card">
            <h3>Fund Size</h3>
            <p className="text-2xl font-semibold">{formatFundSize(etf.fund_size_billions)}</p>
          </div>

          <div className="stat-card">
            <h3>Total Expense Ratio</h3>
            <p className="text-2xl font-semibold">{formatTER(etf.ter_percent)}</p>
          </div>

          <div className="stat-card">
            <h3>Replication Method</h3>
            <p className="text-2xl font-semibold">{etf.replication_method}</p>
          </div>

          <div className="stat-card">
            <h3>Distribution Policy</h3>
            <p className="text-2xl font-semibold">{etf.distribution_policy}</p>
          </div>

          <div className="stat-card">
            <h3>Fund Currency</h3>
            <p className="text-2xl font-semibold">{etf.fund_currency}</p>
          </div>

          <div className="stat-card">
            <h3>Domicile</h3>
            <p className="text-2xl font-semibold">{etf.domicile}</p>
          </div>

          <div className="stat-card">
            <h3>Launch Date</h3>
            <p className="text-2xl font-semibold">{formatLaunchDate(etf.launch_date)}</p>
          </div>

          <div className="stat-card">
            <h3>Index Tracked</h3>
            <p className="text-2xl font-semibold">{etf.index_tracked}</p>
          </div>
        </div>
      </div>
    </>
  )
}
