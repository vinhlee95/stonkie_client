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
    const dataset = {
      type: 'bar' as const,
      label: data[0]?.metric || 'Value',
      data: data.map(item => item.value),
      backgroundColor: '#42a287',
      borderColor: '#10b981',
      borderWidth: 1,
      borderRadius: 4
    };

    return (
      <FinancialChart
        title={title}
        labels={data.map(item => item.period)}
        datasets={[dataset]}
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
              <h2 className="text-xl font-bold mb-4">{item.title}</h2>
              <p className="mb-4">{item.content}</p>
            </>
          )}
          {item.type === 'chart' && item.data && (
            <div className="w-full">
              {renderChart(item.data, item.title)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
