/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
} from 'chart.js'
import { Chart as ChartComponent } from 'react-chartjs-2'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import FinancialPeriodTab from '@/app/components/FinancialPeriodTab'
import { Sparkles } from 'lucide-react'

// Register the required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
)

interface Dataset {
  type: 'bar' | 'line'
  label: string
  data: number[]
  backgroundColor?: string
  borderColor: string
  borderWidth?: number
  borderRadius?: number
  yAxisID?: string
  pointBackgroundColor?: string
  pointRadius?: number
  pointHoverRadius?: number
  fill?: boolean
  tension?: number
}

interface ChartProps {
  title: string
  labels: string[]
  datasets: Dataset[]
  height?: number
  marginTop?: number
  yAxisConfig?: {
    showPercentage?: boolean
    formatAsCurrency?: boolean
  }
  yAxisFormatType?: 'currency' | 'percentage' | 'number'
  yAxisFormatOptions?: {
    decimals?: number
    prefix?: string
    suffix?: string
  }
  children?: React.ReactNode
}

interface FinancialChartProps extends ChartProps {
  quaterlyDatasets: Dataset[]
  quarterlyLabels: string[]
}

export const Chart: React.FC<ChartProps> = ({
  labels,
  datasets,
  height = 250,
  yAxisConfig = { formatAsCurrency: true, showPercentage: false },
  yAxisFormatType = 'currency',
  yAxisFormatOptions = { decimals: 1 },
  children,
}) => {
  const chartData = {
    labels,
    datasets,
  }
  const activeLegendRef = useRef<string | null>(null)

  const formatYAxisValue = (value: any): string => {
    if (typeof value !== 'number') return ''

    const { decimals = 1, prefix = '', suffix = '' } = yAxisFormatOptions

    if (yAxisFormatType === 'percentage') {
      return `${prefix}${value.toFixed(decimals)}%${suffix}`
    }

    if (yAxisFormatType === 'number') {
      return `${prefix}${value.toFixed(decimals)}${suffix}`
    }

    const absValue = Math.abs(value)
    const formattedValue =
      absValue >= 1e9
        ? `$${(absValue / 1e9).toFixed(decimals)}B`
        : absValue >= 1e6
          ? `$${(absValue / 1e6).toFixed(decimals)}M`
          : `$${absValue}`

    return value < 0 ? `-${formattedValue}` : formattedValue
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
        onClick: (e: any, legendItem: any, legend: any) => {
          const chart = legend.chart

          // Reset chart when re-clicking active legend
          if (
            activeLegendRef.current !== null &&
            legendItem.datasetIndex === activeLegendRef.current
          ) {
            chart.data.datasets.forEach((dataset: any) => {
              dataset.hidden = false
            })

            activeLegendRef.current = null
            chart.update()
            return
          }

          // If selecting a new legend -> show that legend and hide the rest
          chart.data.datasets.forEach((dataset: any, index: number) => {
            // Only show the clicked metric on the chart
            if (index === legendItem.datasetIndex) {
              dataset.hidden = false
            } else {
              // Hide the rest of the metrics
              dataset.hidden = true
            }
          })

          activeLegendRef.current = legendItem.datasetIndex
          chart.update()
          return
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          callback: function (value: any): string {
            return formatYAxisValue(value)
          },
        },
      },
      ...(yAxisConfig.showPercentage && {
        percentage: {
          beginAtZero: true,
          position: 'right' as const,
          grid: {
            display: false,
          },
          ticks: {
            callback: function (value: any): string {
              return `${Number(value).toFixed(0)}%`
            },
          },
        },
      }),
    },
  }

  return (
    <div>
      {children}
      <div style={{ height }}>
        <ChartComponent type="bar" data={chartData} options={options} />
      </div>
    </div>
  )
}

function ChartTitle({
  title,
  onInsightButtonClick,
}: {
  title: string
  onInsightButtonClick: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-xl font-bold">{title}</h1>

      <button
        className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer"
        onClick={onInsightButtonClick}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Insights</span>
      </button>
    </div>
  )
}

export default function ChartWithPeriod({
  title,
  labels: annualLabels,
  datasets: annualDatasets,
  quaterlyDatasets,
  quarterlyLabels,
  height = 250,
  yAxisConfig = { formatAsCurrency: true, showPercentage: false },
  yAxisFormatType = 'currency',
  yAxisFormatOptions = { decimals: 1 },
}: FinancialChartProps) {
  const [timePeriod, setTimePeriod] = React.useState<'Annual' | 'Quarterly'>('Annual')
  const router = useRouter()
  const params = useParams()
  const ticker = params.ticker as string

  const getInsightTypeByTitle = (title: string) => {
    if (title.includes('Growth')) return 'growth'
    if (title.includes('Earning')) return 'earnings'
    if (title.includes('Debt')) return 'cash_flow'

    return 'growth'
  }

  const onInsightButtonClick = () => {
    const insightType = getInsightTypeByTitle(title)
    router.push(`/tickers/${ticker}/insights/${insightType}`)
  }

  const labels = timePeriod === 'Quarterly' ? quarterlyLabels : annualLabels
  const datasets = timePeriod === 'Quarterly' ? quaterlyDatasets : annualDatasets

  return (
    <Chart
      title={title}
      labels={labels}
      datasets={datasets}
      height={height}
      yAxisConfig={yAxisConfig}
      yAxisFormatType={yAxisFormatType}
      yAxisFormatOptions={yAxisFormatOptions}
    >
      <ChartTitle title={title} onInsightButtonClick={onInsightButtonClick} />
      <FinancialPeriodTab selectedPeriod={timePeriod} onPeriodChange={setTimePeriod} />
    </Chart>
  )
}
