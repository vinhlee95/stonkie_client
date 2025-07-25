import { Chart } from '@/app/components/FinancialChart'
import FinancialPeriodTabWithRouterChange from '@/app/components/FinancialPeriodTabWithRouterChange'
import { isAnnualStatement, isQuarterlyStatement, type FinancialStatement } from '@/app/types'
import { formatNumber } from '@/utils/formatter'

const HIGHLIGHTED_METRICS = [
  'Total revenue',
  'Cost of Revenue',
  'Gross profit',
  'Net income',
  'Operating income',
  'Operating expense',
  'Pretax income',
  'EPS',
  'Basic EPS',
  'Diluted EPS',
  'EBIT',
]

function getDisplayPeriod(period: string | number, statements: FinancialStatement[]): string {
  if (typeof period === 'string') return period

  const statement = statements.find((s) => {
    if (!isAnnualStatement(s)) return false
    return s.period_end_year === period
  })

  if (!statement || !isAnnualStatement(statement)) return period.toString()
  return statement.is_ttm ? 'TTM' : period.toString()
}

export default async function IncomeStatement({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>
  searchParams: Promise<{ period?: string }>
}) {
  const { ticker } = await params
  const { period: periodParam } = await searchParams
  const period = periodParam === 'quarterly' ? 'quarterly' : null

  const URL = period
    ? `${process.env.BACKEND_URL}/api/companies/${ticker.toLowerCase()}/statements?report_type=income_statement&period_type=${period}`
    : `${process.env.BACKEND_URL}/api/companies/${ticker.toLowerCase()}/statements?report_type=income_statement`

  const res = await fetch(URL, { next: { revalidate: 15 * 60 } })
  const statements = (await res.json()) as FinancialStatement[]

  if (!statements || statements.length === 0) {
    return (
      <div className="p-4">
        <p className="text-gray-600 dark:text-gray-400">
          No financial statements available for this company.
        </p>
      </div>
    )
  }

  // Get all periods from the statements
  const periods = statements
    .map((s) => (isQuarterlyStatement(s) ? s.period_end_quarter : s.period_end_year))
    .sort((a, b) => {
      if (typeof a === 'string' && typeof b === 'string') {
        // Parse MM/DD/YYYY dates
        const [aMonth, aDay, aYear] = a.split('/').map(Number)
        const [bMonth, bDay, bYear] = b.split('/').map(Number)
        const aDate = new Date(aYear, aMonth - 1, aDay)
        const bDate = new Date(bYear, bMonth - 1, bDay)
        return aDate.getTime() - bDate.getTime()
      }
      if (typeof a === 'number' && typeof b === 'number') return a - b
      return 0
    })

  // Get all unique metrics from the statements
  const allMetrics = new Set<string>()
  statements.forEach((statement) => {
    Object.keys(statement.data).forEach((metric) => allMetrics.add(metric))
  })

  // Filter metrics based on highlighted metrics
  const filteredMetrics = Array.from(allMetrics).filter((metric) =>
    HIGHLIGHTED_METRICS.some((highlighted) => metric.toLowerCase() === highlighted.toLowerCase()),
  )

  const renderIncomeStatementChart = () => {
    if (!statements || statements.length === 0) return null

    const metrics = [
      { label: 'Total Revenue', key: 'Total Revenue', color: '#3b82f6' },
      { label: 'Gross Profit', key: 'Gross Profit', color: '#10b981' },
      { label: 'Operating Income', key: 'Operating Income', color: '#f59e0b' },
      { label: 'Pretax Income', key: 'Pretax Income', color: '#8b5cf6' },
      { label: 'Net Income', key: 'Net Income', color: '#ef4444' },
    ]

    const datasets = metrics.map((metric) => ({
      type: 'bar' as const,
      label: metric.label,
      data: periods.map((period) => {
        const statement = statements.find((s) =>
          typeof period === 'string'
            ? isQuarterlyStatement(s) && s.period_end_quarter === period
            : isAnnualStatement(s) && s.period_end_year === period,
        )
        if (!statement) return 0
        const value = statement.data[metric.key]
        return value ? Number(value) / 1000000 : 0 // Convert to billions
      }),
      backgroundColor: metric.color,
      borderColor: metric.color,
      borderRadius: 4,
      barPercentage: 0.7,
    }))

    return (
      <div className="mb-2">
        <Chart
          title=""
          labels={periods.map((period) => getDisplayPeriod(period, statements))}
          datasets={datasets}
          height={200}
          marginTop={0}
        />
      </div>
    )
  }

  return (
    <>
      <FinancialPeriodTabWithRouterChange />
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        All numbers are in billions of USD.
      </p>
      {renderIncomeStatementChart()}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left border-b border-gray-200">Metric</th>
              {periods.map((period) => (
                <th key={period} className="px-4 py-2 text-left border-b border-gray-200">
                  {getDisplayPeriod(period, statements)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredMetrics.map((metric, index) => (
              <tr key={index}>
                <td className="px-4 py-2 border-b border-gray-200">{metric}</td>
                {periods.map((period) => {
                  const statement = statements.find((s) => {
                    if (typeof period === 'string') {
                      return isQuarterlyStatement(s) && s.period_end_quarter === period
                    }
                    if (!isAnnualStatement(s)) return false
                    return s.period_end_year === period
                  })
                  const value = statement?.data[metric]
                  return (
                    <td key={period} className="px-4 py-2 border-b border-gray-200">
                      {value ? formatNumber(Number(value)) : '-'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
