'use client'
import { useState, useEffect, useRef } from "react";
import {Chart} from '@/app/components/FinancialChart';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

type ChartData = {
  period: string;
  value: number;
  metric: string;
  value_type: 'currency' | 'percentage'

};

type ContentItem = {
  type: 'text' | 'chart';
  title: string;
  content: string;
  data: ChartData[] | null;
  source: string[];
};

export default function InsightReport({ticker, slug}: {ticker: string, slug: string}) {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const hasFetchedDetailedReport = useRef(false);   

  const fetchDetailedReport = async (slug: string) => {
    try {
      setIsStreaming(true);
      const response = await fetch(`${BACKEND_URL}/api/companies/${ticker.toUpperCase()}/dynamic-report/${slug}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not yet supported in this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Done streaming');
          setIsStreaming(false);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete JSON objects from the buffer
        let startIndex = 0;
        while (true) {
          const endIndex = buffer.indexOf('\n', startIndex);
          if (endIndex === -1) {
            buffer = buffer.slice(startIndex);
            break;
          }

          const jsonStr = buffer.slice(startIndex, endIndex).trim();
          if (jsonStr) {
            try {
              const contentItem = JSON.parse(jsonStr);
              setContentItems(prevItems => [...prevItems, contentItem]);
            } catch (e) {
              console.error('Error parsing JSON chunk:', e);
            }
          }
          startIndex = endIndex + 1;
        }
      }
    } catch (error) {
      console.error('Error fetching detailed report:', error);
      setIsStreaming(false);
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

    // Determine the value type from the first data point
    const valueType = data[0]?.value_type || 'currency';
    const isPercentage = valueType === 'percentage';

    // Create a dataset for each metric
    const datasets = metrics.map((metric, index) => {
      // Use different colors for each metric
      const colors = [
        { backgroundColor: '#34d399', borderColor: '#059669' }, // green
        { backgroundColor: '#3b82f6', borderColor: '#2563eb' }, // blue
        { backgroundColor: '#f59e0b', borderColor: '#d97706' }, // yellow/orange
        { backgroundColor: '#ef4444', borderColor: '#dc2626' }  // red
      ];
      const colorIndex = index % colors.length;

      const baseConfig = {
        label: metric.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        data: periods.map(period => {
          const dataPoint = data.find(item => item.period === period && item.metric === metric);
          if (!dataPoint) return 0;
          
          // Only multiply by 1000 for currency values
          return valueType === 'currency' ? dataPoint.value * 1000 : dataPoint.value;
        }),
        borderColor: colors[colorIndex].borderColor,
        borderWidth: 2,
      };

      if (isPercentage) {
        return {
          ...baseConfig,
          type: 'line' as const,
          pointBackgroundColor: colors[colorIndex].borderColor,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
          tension: 0.4,
        };
      }

      return {
        ...baseConfig,
        type: 'bar' as const,
        backgroundColor: colors[colorIndex].backgroundColor,
        borderRadius: 4,
      };
    });

    return (
      <Chart
        title={title}
        labels={periods}
        datasets={datasets}
        yAxisFormatType={valueType}
        yAxisFormatOptions={{ 
          decimals: 1,
        }}
      />
    );
  };

  const LoadingSkeleton = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        {/* Title skeleton */}
        <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        
        {/* Content skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-3/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-2/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );

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
          <div className="flex flex-wrap gap-2 mt-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Sources:</p>
            {item.source.map((src, idx) => (
              <span
                key={idx}
                className="inline-block bg-[#2d6e5b] text-white text-xs px-3 py-1 rounded-full"
              >
                {src}
              </span>
            ))}
          </div>
        </div>
      ))}
      {isStreaming && <LoadingSkeleton />}
    </div>
  )
}
