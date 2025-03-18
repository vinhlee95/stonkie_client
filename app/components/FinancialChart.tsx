'use client'

import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';

// Register the required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface Dataset {
  type: 'bar' | 'line';
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor: string;
  borderWidth?: number;
  borderRadius?: number;
  yAxisID?: string;
  pointBackgroundColor?: string;
  pointRadius?: number;
  pointHoverRadius?: number;
  fill?: boolean;
  tension?: number;
}

interface ChartProps {
  title: string;
  labels: string[];
  datasets: Dataset[];
  height?: number;
  marginTop?: number;
  yAxisConfig?: {
    showPercentage?: boolean;
    formatAsCurrency?: boolean;
  };
  yAxisFormatType?: 'currency' | 'percentage' | 'number';
  yAxisFormatOptions?: {
    decimals?: number;
    prefix?: string;
    suffix?: string;
  };
}

const FinancialChart: React.FC<ChartProps> = ({
  title,
  labels,
  datasets,
  height = 250,
  yAxisConfig = { formatAsCurrency: true, showPercentage: false },
  yAxisFormatType = 'currency',
  yAxisFormatOptions = { decimals: 1 }
}) => {
  const chartData = {
    labels,
    datasets,
  };

  const formatYAxisValue = (value: any): string => {
    if (typeof value !== 'number') return '';
    
    const { decimals = 1, prefix = '', suffix = '' } = yAxisFormatOptions;
    
    if (yAxisFormatType === 'percentage') {
      return `${prefix}${value.toFixed(decimals)}%${suffix}`;
    }
    
    if (yAxisFormatType === 'number') {
      return `${prefix}${value.toFixed(decimals)}${suffix}`;
    }
    
    // Default currency formatting
    return value >= 1e9 
      ? `$${(value / 1e9).toFixed(decimals)}B`
      : value >= 1e6
      ? `$${(value / 1e6).toFixed(decimals)}M`
      : `$${value}`;
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            family: "'Inter', sans-serif",
            size: 12,
          },
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
          font: {
            family: "'Inter', sans-serif",
            size: 12,
          },
          callback: function(value: any): string {
            return formatYAxisValue(value);
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
            font: {
              family: "'Inter', sans-serif",
              size: 12,
            },
            callback: function(value: any): string {
              return `${Number(value).toFixed(0)}%`;
            },
          },
        },
      }),
    },
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        {title}
      </h1>
      <div style={{ height }}>
        <Chart type='bar' data={chartData} options={options} />
      </div>
    </div>
  );
};

export default FinancialChart; 