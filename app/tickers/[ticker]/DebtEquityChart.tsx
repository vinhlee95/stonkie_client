import ChartWithPeriod from '@/app/components/FinancialChart'
import {
  AnnualFinancialStatement,
  FinancialStatement,
  isAnnualStatement,
  isQuarterlyStatement,
  QuarterlyFinancialStatement,
} from '@/app/types'
import {
  ChartDataOutput,
  ChartDatasetDefinition,
  parseFinancialValue,
  processAnnualStatements,
  processQuarterlyStatements,
} from './chartUtils'

function getChartDataset(balanceSheets: Array<FinancialStatement>): ChartDataOutput {
  if (!balanceSheets || balanceSheets.length === 0) {
    return { labels: [], datasets: [] }
  }

  let sortedBalanceSheets: AnnualFinancialStatement[] | QuarterlyFinancialStatement[]
  let generatedLabels: string[]

  if (isAnnualStatement(balanceSheets[0])) {
    const { generatedLabels: annualLabelsBS, sortedStatements: annualSortedBS } =
      processAnnualStatements(balanceSheets as AnnualFinancialStatement[])
    generatedLabels = annualLabelsBS
    sortedBalanceSheets = annualSortedBS
  } else if (isQuarterlyStatement(balanceSheets[0])) {
    const { generatedLabels: quarterlyLabelsBS, sortedStatements: quarterlySortedBS } =
      processQuarterlyStatements(balanceSheets as QuarterlyFinancialStatement[])
    generatedLabels = quarterlyLabelsBS
    sortedBalanceSheets = quarterlySortedBS
  } else {
    console.error('Unknown or mixed statement types in getChartDataset', balanceSheets[0])
    return { labels: [], datasets: [] }
  }

  const firstData = sortedBalanceSheets[0]?.data
  if (!firstData) return { labels: generatedLabels, datasets: [] }

  const totalDebtKey = Object.keys(firstData).find((key) =>
    key.toLowerCase().includes('total debt'),
  )
  const equityKey = Object.keys(firstData).find(
    (key) =>
      key.toLowerCase().includes('total common equity') ||
      key.toLowerCase().includes('common stock equity'),
  )

  if (!totalDebtKey || !equityKey) {
    console.warn('Required keys not found: Total Debt or Common Equity')
    return { labels: generatedLabels, datasets: [] }
  }

  const totalDebt = sortedBalanceSheets.map(
    (key) => parseFinancialValue(key.data[totalDebtKey!]) * 1000,
  )
  const equity = sortedBalanceSheets.map((key) => parseFinancialValue(key.data[equityKey!]) * 1000)

  const ratio = totalDebt.map((debt, i) => {
    const e = equity[i]
    if (!e || e == 0) return NaN
    return (debt / e) * 100
  })

  const datasets: ChartDatasetDefinition[] = [
    {
      type: 'bar',
      label: 'Total Debt',
      data: totalDebt,
      backgroundColor: '#4287f5',
      borderColor: '#4287f5',
      borderWidth: 0,
      borderRadius: 4,
      yAxisID: 'y',
    },
    {
      type: 'bar',
      label: 'Common Stock Equity',
      data: equity,
      backgroundColor: '#63e6e2',
      borderColor: '#63e6e2',
      borderWidth: 0,
      borderRadius: 4,
      yAxisID: 'y',
    },
    {
      type: 'line',
      label: 'Debt / Equity (%)',
      data: ratio.filter((value) => !isNaN(value)),
      borderColor: '#ff9f40',
      borderWidth: 2,
      pointBackgroundColor: '#ff9f40',
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: false,
      yAxisID: 'percentage',
      tension: 0.4,
    },
  ]
  return { labels: generatedLabels, datasets }
}

export default async function DebtEquityChart({
  balanceSheet: annualBalanceSheet,
  ticker,
}: {
  balanceSheet: AnnualFinancialStatement[]
  ticker: string
}) {
  const quarterlyBalanceSheetResponse = await fetch(
    `${process.env.BACKEND_URL}/api/companies/${ticker.toLowerCase()}/statements?report_type=balance_sheet&period_type=quarterly`,
    { next: { revalidate: 15 * 60 } },
  )
  if (!quarterlyBalanceSheetResponse.ok) {
    console.error('Failed to fetch quarterly data')
    return null
  }
  const quarterlyBalanceSheetData =
    (await quarterlyBalanceSheetResponse.json()) as QuarterlyFinancialStatement[]
  const annualData = getChartDataset(annualBalanceSheet)
  const quarterlyData = getChartDataset(quarterlyBalanceSheetData)
  if (!annualData.datasets.length && !quarterlyData.datasets.length) return null
  return (
    <ChartWithPeriod
      title="Debt to Equity"
      labels={annualData.labels}
      datasets={annualData.datasets}
      quaterlyDatasets={quarterlyData.datasets}
      quarterlyLabels={quarterlyData.labels}
      yAxisConfig={{ formatAsCurrency: true, showPercentage: true }}
    />
  )
}
