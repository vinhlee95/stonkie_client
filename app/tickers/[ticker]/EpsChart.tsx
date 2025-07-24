import ChartWithPeriod from '@/app/components/FinancialChart'
import {
  AnnualFinancialStatement,
  QuarterlyFinancialStatement,
  FinancialStatement,
  isAnnualStatement,
  isQuarterlyStatement,
} from '@/app/types'
import {
  ChartDataOutput,
  ChartDatasetDefinition,
  processAnnualStatements,
  processQuarterlyStatements,
} from './chartUtils'

// Helper function similar to getChartDataset in GrowthChart.tsx
function getEpsChartDataset(statements: Array<FinancialStatement>): ChartDataOutput {
  if (!statements || statements.length === 0) {
    return { labels: [], datasets: [] }
  }

  let sortedAndProcessedStatements: AnnualFinancialStatement[] | QuarterlyFinancialStatement[]
  let generatedLabels: string[]

  if (isAnnualStatement(statements[0])) {
    const { generatedLabels: annualLabels, sortedStatements: annualSorted } =
      processAnnualStatements(statements as AnnualFinancialStatement[])
    generatedLabels = annualLabels
    sortedAndProcessedStatements = annualSorted
  } else if (isQuarterlyStatement(statements[0])) {
    const { generatedLabels: quarterlyLabels, sortedStatements: quarterlySorted } =
      processQuarterlyStatements(statements as QuarterlyFinancialStatement[])
    generatedLabels = quarterlyLabels
    sortedAndProcessedStatements = quarterlySorted
  } else {
    console.error('Unknown or mixed statement types in getEpsChartDataset', statements[0])
    return { labels: [], datasets: [] }
  }

  const firstStatementData = sortedAndProcessedStatements[0]?.data
  if (!firstStatementData) return { labels: generatedLabels, datasets: [] }

  const basicEpsKey = Object.keys(firstStatementData).find((key) =>
    key.toLowerCase().includes('basic eps'),
  )

  const dilutedEpsKey = Object.keys(firstStatementData).find((key) =>
    key.toLowerCase().includes('diluted eps'),
  )

  if (!basicEpsKey || !dilutedEpsKey) {
    console.warn('Basic EPS or Diluted EPS key not found in statement data.')
    return { labels: generatedLabels, datasets: [] }
  }

  const datasets: ChartDatasetDefinition[] = [
    {
      type: 'bar' as const,
      label: 'Basic EPS',
      data: sortedAndProcessedStatements.map((statement) =>
        parseFloat((statement.data[basicEpsKey!] ?? 0).toString()),
      ),
      backgroundColor: '#4287f5',
      borderColor: '#4287f5',
      borderWidth: 0,
      borderRadius: 4,
      yAxisID: 'y',
    },
    {
      type: 'bar' as const,
      label: 'Diluted EPS',
      data: sortedAndProcessedStatements.map((statement) =>
        parseFloat((statement.data[dilutedEpsKey!] ?? 0).toString()),
      ),
      backgroundColor: '#63e6e2',
      borderColor: '#63e6e2',
      borderWidth: 0,
      borderRadius: 4,
      yAxisID: 'y',
    },
  ]
  return { labels: generatedLabels, datasets }
}

export default async function EpsChart({
  ticker,
  incomeStatements: annualStatements,
}: {
  ticker: string
  incomeStatements: AnnualFinancialStatement[]
}) {
  const URL = `${process.env.BACKEND_URL}/api/companies/${ticker.toLowerCase()}/statements?report_type=income_statement&period_type=quarterly`
  const res = await fetch(URL, { next: { revalidate: 15 * 60 } })
  const quarterlyStatements = (await res.json()) as QuarterlyFinancialStatement[]

  const annualData = getEpsChartDataset(annualStatements)
  const quarterlyData = getEpsChartDataset(quarterlyStatements)

  if (
    (!annualData.datasets || annualData.datasets.length === 0) &&
    (!quarterlyData.datasets || quarterlyData.datasets.length === 0)
  ) {
    return null
  }

  return (
    <ChartWithPeriod
      title="Earnings Per Share"
      labels={annualData.labels}
      datasets={annualData.datasets}
      quaterlyDatasets={quarterlyData.datasets}
      quarterlyLabels={quarterlyData.labels}
      yAxisConfig={{ formatAsCurrency: true }}
    />
  )
}
