import { ETFFundamental } from '@/types/etf'

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

interface MetricCardProps {
  label: string
  value: string | number
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div
      className="border border-gray-200 dark:border-gray-600 rounded-xl p-4"
      style={{ backgroundColor: 'var(--card-background)' }}
    >
      <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">{label}</h3>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  )
}

export default function ETFOverview({ etf }: { etf: ETFFundamental }) {
  return (
    <div className="mb-8">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{etf.name}</h1>
          {etf.ticker && (
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ backgroundColor: 'var(--tab-active)', color: 'white' }}
            >
              {etf.ticker}
            </span>
          )}
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: 'var(--button-background)',
              color: 'var(--foreground)',
            }}
          >
            {etf.fund_provider}
          </span>
        </div>
        {etf.isin && <p className="text-gray-600 dark:text-gray-400 text-sm">ISIN: {etf.isin}</p>}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Fund Size" value={formatFundSize(etf.fund_size_billions)} />
        <MetricCard label="Total Expense Ratio" value={formatTER(etf.ter_percent)} />
        <MetricCard label="Replication Method" value={etf.replication_method} />
        <MetricCard label="Distribution Policy" value={etf.distribution_policy} />
        <MetricCard label="Fund Currency" value={etf.fund_currency} />
        <MetricCard label="Domicile" value={etf.domicile} />
        <MetricCard label="Launch Date" value={formatLaunchDate(etf.launch_date)} />
        <MetricCard label="Index Tracked" value={etf.index_tracked} />
      </div>

      {/* Footer */}
      {etf.updated_at && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {formatRelativeTime(etf.updated_at)}
        </div>
      )}
    </div>
  )
}
