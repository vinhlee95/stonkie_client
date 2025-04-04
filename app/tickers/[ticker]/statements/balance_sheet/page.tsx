import FinancialChart from "@/app/components/FinancialChart";
import { formatNumber } from "@/utils/formatter";

interface FinancialData {
  data: Record<string, string | number>[];
  columns: string[];
}

const HIGHLIGHTED_BALANCE_SHEET_ROWS = ['Total assets', 'Total liabilities net minority interest', 'Inventory', 'Cash and cash equivalents', 'Total equity', 'Total Debt', 'Net debt', 'Tangible Book Value', 'Common Stock Equity'];

export default async function IncomeStatement({ params }: { params: Promise<{ ticker: string }> }) {
  const {ticker} = await params
  const res = await fetch(`${process.env.BACKEND_URL}/api/financial-data/${ticker.toLowerCase()}/balance_sheet`, {
    // Cache for 15 minutes
    next: {revalidate: 15*60}
  })
  const data = await res.json() as FinancialData

  // Reverse the columns array (except the first column which is the metric name)
  const firstColumn = data.columns[0];
  const reversedColumns = [firstColumn, ...data.columns.slice(1).reverse()];
  
  const isHighlightedRow = (metric: string): boolean => {
    return HIGHLIGHTED_BALANCE_SHEET_ROWS.some(row => {
      return metric.toLowerCase() === row.toLowerCase()
    });
  };

  // Filter rows based on showAllMetrics state
  const filteredData = data.data.filter(row => {
    return isHighlightedRow(String(row[data.columns[0]]))
  });

  const renderBalanceSheetChart = () => {
    if (!data.data) return null;

    const metrics = [
      { label: 'Total Assets', key: 'total assets', color: '#3b82f6' },
      { label: 'Total Liabilities', key: 'total liabilities', color: '#ef4444' },
    ];

    // Get all years from the data (excluding 'Breakdown' and 'TTM' columns)
    const years = Object.keys(data.data[0])
      .filter(key => key !== 'Breakdown' && key !== 'TTM')
      .sort();

    const datasets = metrics.map(metric => ({
      type: 'bar' as const,
      label: metric.label,
      data: years.map(year => {
        const row = data.data.find(
          row => {
            if(!row['Breakdown'] || typeof row['Breakdown'] !== 'string') return false;
            return row['Breakdown'].trim().toLowerCase().includes(metric.key.trim().toLowerCase());
          }
        );
        return row ? Number(row[year]) / 1000000 : 0; // Convert to billions
      }),
      backgroundColor: metric.color,
      borderColor: metric.color,
      borderRadius: 4,
      barPercentage: 0.7,
    }));

    return (
      <div className='mb-2'>
        <FinancialChart
          title=""
          labels={years.map(year => year.split('/')[2])}
          datasets={datasets}
          height={200}
          marginTop={0}
        />
      </div>
    );
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Balance sheet: {ticker.toUpperCase()}</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">All numbers are in billions of USD.</p>
      {renderBalanceSheetChart()}
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700">
          <thead>
            <tr>
              {reversedColumns.map((column, index) => (
                <th key={index} className="px-4 py-2 text-left border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-gray-50 dark:bg-gray-900" : "bg-white dark:bg-black"}>
                {reversedColumns.map((column, colIndex) => (
                  <td key={colIndex} className="px-4 py-2 border-b border-gray-300 dark:border-gray-700">
                    {colIndex === 0 ? row[column] : formatNumber(Number(row[column]))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}