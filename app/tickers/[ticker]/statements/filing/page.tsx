import { AnnualFiling } from '@/app/types'
import { BarChart3 } from 'lucide-react'
import FinancialPeriodTabWithRouterChange from '@/app/components/FinancialPeriodTabWithRouterChange'

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

      {/* Filing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(selectedPeriod === 'quarterly' ? quarterlyFilings : annualFilings).map(
          (filing, index) => (
            <div key={index} className="border border-gray-200 rounded-xl p-6 bg-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Form {selectedPeriod === 'quarterly' ? '10-Q' : '10-K'} {filing.period_end_year}
                  </h3>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    index === 0 ? 'text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                  style={index === 0 ? { backgroundColor: 'var(--tab-active)' } : {}}
                >
                  {index === 0 ? 'Latest' : 'Complete'}
                </span>
              </div>

              <div className="flex gap-2">
                <a
                  href={filing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white"
                  style={{ backgroundColor: 'var(--tab-active)' }}
                >
                  <BarChart3 size={16} />
                  Analyze
                </a>
                <a
                  href={filing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  View
                </a>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  )
}
