'use client'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js"
import { Bar } from "react-chartjs-2"
import { useTheme } from '@mui/material/styles';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface BreakdownItem {
  label: string
  revenue: number
  percentage: number
}

interface RevenueDataItem {
  year: number
  breakdown: BreakdownItem[]
}

interface RevenueChartProps {
  revenueData: RevenueDataItem[]
}

export default function RevenueChart({ revenueData }: RevenueChartProps) {
  const theme = useTheme();
  const years = revenueData.map((item) => item.year.toString())

  // Color palette for different labels
  const colors = [
    'rgb(82, 130, 255)',   // Blue
    'rgb(99, 205, 255)',   // Light Blue
    'rgb(255, 99, 132)',   // Pink
    'rgb(75, 192, 192)',   // Teal
    'rgb(255, 159, 64)',   // Orange
    'rgb(153, 102, 255)',  // Purple
    'rgb(255, 205, 86)',   // Yellow
    'rgb(201, 203, 207)'   // Gray
  ]

  // Transform data for Chart.js
  const datasets = revenueData[0].breakdown.map((_, index) => {
    return {
      label: revenueData[0].breakdown[index].label,
      data: revenueData.map((item) => Number(item.breakdown[index].revenue / 1e6).toFixed(0)), // Convert to billions
      backgroundColor: colors[index % colors.length],
      borderWidth: 0,
      borderSkipped: false,
      borderRadius: index === revenueData[0].breakdown.length - 1 ? 4 : 0,
    }
  })

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.primary,
        },
      },
      y: {
        stacked: true,
        grid: {
          color: theme.palette.divider,
        },
        border: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.primary,
          callback: (value) => `${value}B`,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}B`,
        },
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
      },
    },
  }

  const data = {
    labels: years,
    datasets,
  }

  return (
    <div>
      <Bar options={options} data={data} />
    </div>
  )
}
