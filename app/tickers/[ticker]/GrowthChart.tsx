import FinancialChart from "@/app/components/FinancialChart";

interface FinancialData {
  data: Record<string, string | number>[];
  columns: string[];
}

export default async function GrowthChart({data}: {data: FinancialData | null}) {
  if (!data) return null;
  const columns = data.columns;
  
  const revenueRow = data.data.find(row => {
    const metric = row[columns[0]];
    return typeof metric === 'string' && 
      metric.toLowerCase().includes('revenue') && 
      !metric.toLowerCase().includes('cost');
  });
  const netIncome = data.data.find(row => {
    const metric = row[columns[0]];
    return typeof metric === 'string' && 
      metric.toLowerCase().includes('net income');
  });

  // Reverse the columns array (except the first column which contains metrics)
  const reversedColumns = [data.columns[0], ...data.columns.slice(1).reverse()];
  
  // Update the data rows to match the reversed column order
  const reversedData = data.data.map(row => {
    const rowValues = Object.values(row);
    return [rowValues[0], ...rowValues.slice(1).reverse()];
  });

  // Update the data object with reversed columns and data
  data = {
    ...data,
    columns: reversedColumns,
    data: reversedData.map(row => {
      const obj: Record<string, string | number> = {};
      reversedColumns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    })
  };

  if (!revenueRow || !netIncome) return null;

  const years = data.columns.slice(1);
  
  // Calculate net margin with 2 decimal places
  const netMarginData = years.map(year => {
    const revenue = parseFloat(revenueRow[year].toString().replace(/[^0-9.-]+/g, ''));
    const income = parseFloat(netIncome[year].toString().replace(/[^0-9.-]+/g, ''));
    return Number(((income / revenue) * 100).toFixed(2));
  });

  const datasets = [
    {
      type: 'bar' as const,
      label: 'Revenue',
      data: years.map(year => parseFloat(revenueRow[year].toString().replace(/[^0-9.-]+/g, ''))),
      backgroundColor: '#4287f5',
      borderColor: '#4287f5',
      borderWidth: 0,
      borderRadius: 4,
      yAxisID: 'y',
    },
    {
      type: 'bar' as const,
      label: 'Net income',
      data: years.map(year => parseFloat(netIncome[year].toString().replace(/[^0-9.-]+/g, ''))),
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