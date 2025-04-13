import FinancialChart from "@/app/components/FinancialChart";
import { FinancialStatement } from "@/app/types";
import { formatNumber } from "@/utils/formatter";

const HIGHLIGHTED_METRICS = [
  'Total assets',
  'Total liabilities net minority interest',
  'Inventory',
  'Cash and cash equivalents',
  'Total equity',
  'Total Debt',
  'Net debt',
  'Tangible Book Value',
  'Common Stock Equity'
];

export default async function BalanceSheet({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const res = await fetch(
    `${process.env.BACKEND_URL}/api/companies/${ticker.toLowerCase()}/statements?report_type=balance_sheet`,
    { next: { revalidate: 15 * 60 } }
  );
  const statements = await res.json() as FinancialStatement[];

  if (!statements || statements.length === 0) {
    return (
      <div className="p-4">
        <p className="text-gray-600 dark:text-gray-400">No balance sheet data available for this company.</p>
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

  const renderBalanceSheetChart = () => {
    if (!statements || statements.length === 0) return null;

    const metrics = [
      { label: 'Total Assets', key: 'Total assets', color: '#3b82f6' },
      { label: 'Total Liabilities', key: 'Total liabilities', color: '#ef4444' },
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
    <>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">All numbers are in billions of USD.</p>
      {renderBalanceSheetChart()}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left border-b border-gray-200">
                Metric
              </th>
              {years.map(year => (
                <th key={year} className="px-4 py-2 text-left border-b border-gray-200">
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredMetrics.map((metric, index) => (
              <tr key={index}>
                <td className="px-4 py-2 border-b border-gray-200">
                  {metric}
                </td>
                {years.map(year => {
                  const statement = statements.find(s => s.period_end_year === year);
                  const value = statement?.data[metric];
                  return (
                    <td key={year} className="px-4 py-2 border-b border-gray-200">
                      {value ? formatNumber(Number(value)) : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}