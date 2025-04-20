/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect } from 'react';
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
  LineController
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import InsightModal from './InsightModal';
import InsightContent from './InsightContent';

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
  LineController
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
  yAxisFormatOptions = { decimals: 1 },
}) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const closeModal = () => {
    setShowModal(false);
  };

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
            callback: function(value: any): string {
              return `${Number(value).toFixed(0)}%`;
            },
          },
        },
      }),
    },
  };

  const getInsightTypeByTitle = (title: string) => {
    if (title.includes('Growth')) return 'growth';
    if (title.includes('Earning')) return 'earning';
    if (title.includes('Debt')) return 'cash_flow';
    
    throw new Error('Failed to get insight type by title');
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold">
          {title}
        </h1>
        <button className="cursor-pointer" onClick={() => setShowModal(true)}>
          <svg 
            className="h-5 w-5 text-gray-400 mt-1" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <div style={{ height }}>
        <Chart type='bar' data={chartData} options={options} />
      </div>

      {showModal && (
        <InsightModal
          closeModal={closeModal}
        >
          <InsightContent type={getInsightTypeByTitle(title)} />
        </InsightModal>
      )}
    </div>
  );
};

export default FinancialChart; 