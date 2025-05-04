'use client'
import { useState, useEffect, useRef } from "react";
import FinancialChart from '@/app/components/FinancialChart';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

type ChartData = {
  period: string;
  value: number;
  metric: string;
};

type ContentItem = {
  type: 'text' | 'chart';
  title: string;
  content: string;
  data: ChartData[] | null;
};

export default function InsightReport({ticker, slug}: {ticker: string, slug: string}) {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const hasFetchedDetailedReport = useRef(false);   

  const fetchDetailedReport = async (slug: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/companies/${ticker.toUpperCase()}/dynamic-report/${slug}`);
      const data = await response.json();
      setContentItems(data);
    } catch (error) {
      console.error('Error fetching detailed report:', error);
    }
  };

  useEffect(() => {
    if (!hasFetchedDetailedReport.current) {
      hasFetchedDetailedReport.current = true;
      fetchDetailedReport(slug);
    }
  }, [slug]);

  const renderChart = (data: ChartData[], title: string) => {
    // Group data by metric
    const metrics = Array.from(new Set(data.map(item => item.metric)));
    
    // Sort periods chronologically
    const periods = Array.from(new Set(data.map(item => item.period))).sort((a, b) => {
      // Check if the period is a date string (e.g., "12/31/2024")
      const isDateA = /\d{1,2}\/\d{1,2}\/\d{4}/.test(a);
      const isDateB = /\d{1,2}\/\d{1,2}\/\d{4}/.test(b);
      
      if (isDateA && isDateB) {
        // Parse dates and compare
        const [monthA, dayA, yearA] = a.split('/').map(Number);
        const [monthB, dayB, yearB] = b.split('/').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateA.getTime() - dateB.getTime();
      }
      
      // If one is a date and the other isn't, put the date first
      if (isDateA) return -1;
      if (isDateB) return 1;
      
      // If neither is a date, compare as strings
      return a.localeCompare(b);
    });

    // Create a dataset for each metric
    const datasets = metrics.map((metric, index) => {
      // Use different colors for each metric
      const colors = [
        { backgroundColor: '#42a287', borderColor: '#10b981' },
        { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
        { backgroundColor: '#f59e0b', borderColor: '#d97706' },
        { backgroundColor: '#ef4444', borderColor: '#dc2626' }
      ];
      const colorIndex = index % colors.length;

      return {
        type: 'bar' as const,
        label: metric.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        data: periods.map(period => {
          const dataPoint = data.find(item => item.period === period && item.metric === metric);
          // *1000 since the data is in thousands
          return dataPoint ? dataPoint.value * 1000 : 0;
        }),
        backgroundColor: colors[colorIndex].backgroundColor,
        borderColor: colors[colorIndex].borderColor,
        borderWidth: 1,
        borderRadius: 4
      };
    });

    return (
      <FinancialChart
        title={title}
        labels={periods}
        datasets={datasets}
        yAxisFormatType="currency"
        yAxisFormatOptions={{ decimals: 1 }}
      />
    );
  };

  return (
    <div className="prose max-w-none space-y-8">
      {contentItems.map((item, index) => (
        <div key={index} className="mb-8">
          {item.type === 'text' && (
            <>
              <h1 className="text-2xl font-bold mb-4">{item.title}</h1>
              <p className="mb-4">{item.content}</p>
            </>
          )}
          {item.type === 'chart' && item.data && (
            <div className="w-full">
              {renderChart(item.data, item.title)}
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{item.content}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
