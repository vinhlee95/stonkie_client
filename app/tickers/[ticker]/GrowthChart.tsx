import FinancialChart from "@/app/components/FinancialChart";

type IncomeStatement = {
  year: number;
  data: Record<string, number | null>;
}

export default async function GrowthChart({incomeStatements}: {incomeStatements: IncomeStatement[]}) {
  // Sort income statements by year in ascending order
  const sortedStatements = [...incomeStatements].sort((a, b) => a.year - b.year);
  
  // Find revenue and net income keys from the first statement (they should be consistent across years)
  const firstStatement = sortedStatements[0];
  const revenueKey = Object.keys(firstStatement.data).find(key => 
    key.toLowerCase().includes('revenue') && 
    !key.toLowerCase().includes('cost')
  );
  
  const netIncomeKey = Object.keys(firstStatement.data).find(key => 
    key.toLowerCase().includes('net income')
  );

  if (!revenueKey || !netIncomeKey) return null;

  const years = sortedStatements.map(statement => statement.year.toString());
  
  // Calculate net margin with 2 decimal places
  const netMarginData = sortedStatements.map(statement => {
    const revenue = parseFloat((statement.data[revenueKey] ?? 0).toString().replace(/[^0-9.-]+/g, ''));
    const income = parseFloat((statement.data[netIncomeKey] ?? 0).toString().replace(/[^0-9.-]+/g, ''));
    return Number(((income / revenue) * 100).toFixed(2));
  });

  const datasets = [
    {
      type: 'bar' as const,
      label: 'Revenue',
      data: sortedStatements.map(statement => 
        parseFloat((statement.data[revenueKey] ?? 0).toString().replace(/[^0-9.-]+/g, ''))
      ),
      backgroundColor: '#4287f5',
      borderColor: '#4287f5',
      borderWidth: 0,
      borderRadius: 4,
      yAxisID: 'y',
    },
    {
      type: 'bar' as const,
      label: 'Net income',
      data: sortedStatements.map(statement => 
        parseFloat((statement.data[netIncomeKey] ?? 0).toString().replace(/[^0-9.-]+/g, ''))
      ),
      backgroundColor: '#63e6e2',
      borderColor: '#63e6e2',
      borderWidth: 0,
      borderRadius: 4,
      yAxisID: 'y',
    },
    {
      type: 'line' as const,
      label: 'Net Margin (%)',
      data: netMarginData,
      borderColor: '#ff9f40',
      borderWidth: 2,
      pointBackgroundColor: '#ff9f40',
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: false,
      yAxisID: 'percentage',
      tension: 0.4,
    },
  ];

  return (
    <FinancialChart
      title="Growth and Profitability"
      labels={years}
      datasets={datasets}
      yAxisConfig={{ formatAsCurrency: true, showPercentage: true }}
    />
  );
}