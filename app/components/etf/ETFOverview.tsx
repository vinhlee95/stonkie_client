'use client'
import { ETFFundamental } from '@/types/etf'
import ETFFavouriteButton from '@/app/components/ETFFavouriteButton'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const PriceChart = dynamic(() => import('@/app/tickers/[ticker]/PriceChart'), {
  ssr: false,
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

/**
 * Format ISO timestamp to relative time (e.g., "Updated 2 hours ago")
 */
function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `Updated ${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
  } else if (diffHours > 0) {
    return `Updated ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  } else if (diffMinutes > 0) {
    return `Updated ${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
  } else {
    return 'Updated just now'
  }
}

export default function ETFOverview({ etf }: { etf: ETFFundamental }) {
  const etfListItem = {
    ticker: etf.ticker || '',
    name: etf.name,
    fund_provider: etf.fund_provider,
  }

  return (
    <>
      {/* Header Section - matching stock page style */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{etf.name}</h1>
          <h2 className="text-gray-600 dark:text-gray-400">
            {etf.ticker || 'N/A'}
            {etf.isin && ` • ISIN: ${etf.isin}`}
          </h2>
        </div>
        {etf.ticker && (
          <div className="ml-4">
            <ETFFavouriteButton etf={etfListItem} />
          </div>
        )}
      </div>

      {/* Price Chart */}
      <Suspense fallback={<p>Loading price chart...</p>}>
        <PriceChart ticker={etf.ticker || ''} />
      </Suspense>

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

      {/* Footer */}
      {etf.updated_at && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {formatRelativeTime(etf.updated_at)}
        </div>
      )}
    </>
  )
}
