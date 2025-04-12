import FinancialChart from "@/app/components/FinancialChart";
import { FinancialStatement } from "@/app/types";
import { formatNumber } from "@/utils/formatter";

const HIGHLIGHTED_METRICS = [
  'Operating cash flow',
  'Financing cash flow',
  'Investing cash flow',
  'Repurchase of Capital Stock',
  'Free cash flow'
];

export default async function CashFlow({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const res = await fetch(
    `${process.env.BACKEND_URL}/api/companies/${ticker.toLowerCase()}/statements?report_type=cash_flow`,
    { next: { revalidate: 15 * 60 } }
  );
  const statements = await res.json() as FinancialStatement[];

  if (!statements || statements.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Cash Flow: {ticker.toUpperCase()}</h1>
        <p className="text-gray-600 dark:text-gray-400">No cash flow data available for this company.</p>
      </div>
    );
  }

  // Get all years from the statements
  const years = statements.map(s => s.period_end_year).sort((a, b) => a - b);
  
  // Get all unique metrics from the statements
  const allMetrics = new Set<string>();
  statements.forEach(statement => {
    Object.keys(statement.data).forEach(metric => allMetrics.add(metric));
  });

  // Filter metrics based on highlighted metrics
  const filteredMetrics = Array.from(allMetrics).filter(metric => 
    HIGHLIGHTED_METRICS.some(highlighted => 
      metric.toLowerCase() === highlighted.toLowerCase()
    )
  );

  const renderCashFlowChart = () => {
    if (!statements || statements.length === 0) return null;

    const metrics = [
      { label: 'Operating cash flow', key: 'operating cash flow', color: '#3b82f6' },
      { label: 'Investing cash flow', key: 'investing cash flow', color: '#10b981' },
      { label: 'Financing cash flow', key: 'financing cash flow', color: '#f59e0b' },
    ];

    // First, let's verify which metrics actually exist in the data
    const availableMetrics = new Set<string>();
    statements.forEach(statement => {
      Object.keys(statement.data).forEach(key => availableMetrics.add(key));
    });

    // Filter metrics to only include those that exist in the data
    const validMetrics = metrics.filter(metric => 
      Array.from(availableMetrics).some(available => 
        metric.key.toLowerCase().includes(available.toLowerCase()) || 
        available.toLowerCase().includes(metric.key.toLowerCase())
      )
    );

    const datasets = validMetrics.map(metric => ({
      type: 'bar' as const,
      label: metric.label,
      data: years.map(year => {
        const statement = statements.find(s => s.period_end_year === year);
        if (!statement) return 0;
        // Find the exact key that matches (case-insensitive)
        const exactKey = Object.keys(statement.data).find(
          key => key.toLowerCase().includes(metric.key.toLowerCase()) || 
                 metric.key.toLowerCase().includes(key.toLowerCase())
        );
        if (!exactKey) return 0;
        const value = statement.data[exactKey];
        return value ? Number(value) / 1000000 : 0; // Convert to billions
      }),
      backgroundColor: metric.color,
      borderColor: metric.color,
      borderRadius: 4,
      barPercentage: 0.7,
    }));

    return (
      <div className="mb-2">
        <FinancialChart
          title=""
          labels={years.map(String)}
          datasets={datasets}
          height={200}
          marginTop={0}
        />
      </div>
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Cash Flow: {ticker.toUpperCase()}</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">All numbers are in billions of USD.</p>
      {renderCashFlowChart()}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-[var(--dark-background)]">
                Metric
              </th>
              {years.map(year => (
                <th key={year} className="px-4 py-2 text-left border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-[var(--dark-background)]">
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredMetrics.map((metric, index) => (
              <tr key={metric} className={index % 2 === 0 ? "bg-gray-50 dark:bg-[var(--dark-background)]" : "bg-white dark:bg-[var(--dark-background)]"}>
                <td className="px-4 py-2 border-b border-gray-300 dark:border-gray-700">
                  {metric}
                </td>
                {years.map(year => {
                  const statement = statements.find(s => s.period_end_year === year);
                  const value = statement?.data[metric];
                  return (
                    <td key={year} className="px-4 py-2 border-b border-gray-300 dark:border-gray-700">
                      {value ? formatNumber(Number(value)) : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}