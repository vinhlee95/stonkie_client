import FinancialChart from "@/app/components/FinancialChart";

interface FinancialData {
  data: Record<string, string | number>[];
  columns: string[];
}

export default async function EpsChart({ticker}: {ticker: string}) {
  const res = await fetch(`${process.env.BACKEND_URL}/api/financial-data/${ticker.toLowerCase()}/income_statement`, {
    // Cache for 15 minutes
    next: {revalidate: 15*60}
  })
  const data = await res.json() as FinancialData

  const columns = data.columns;

  const basicEPS = data.data.find(row => {
    const metric = row[columns[0]];
    return typeof metric === 'string' && 
      metric.toLowerCase().includes('basic eps');
  });
  const dilutedEPS = data.data.find(row => {
    const metric = row[columns[0]];
    return typeof metric === 'string' && 
      metric.toLowerCase().includes('diluted eps');
  });

  if (!basicEPS || !dilutedEPS) return null;

  const years = data.columns.slice(1).reverse();

  const chartData = {
    labels: years,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Basic EPS',
        data: years.map(year => {
          if(!basicEPS[year]) return 0
          return parseFloat(basicEPS[year].toString().replace(/[^0-9.-]+/g, ''))
        }),
        backgroundColor: '#4287f5',
        borderColor: '#4287f5',
        borderWidth: 0,
        borderRadius: 4,
      },
      {
        type: 'bar' as const,
        label: 'Diluted EPS',
        data: years.map(year => {
          if(!dilutedEPS[year]) return 0
          return parseFloat(dilutedEPS[year].toString().replace(/[^0-9.-]+/g, ''))
        }),
        backgroundColor: '#63e6e2',
        borderColor: '#63e6e2',
        borderWidth: 0,
        borderRadius: 4,
      },
    ],
  };

  return (
    <FinancialChart
      title="EPS"
      labels={years}
      datasets={chartData.datasets}
      yAxisConfig={{ formatAsCurrency: true, showPercentage: false }}
    />
  );
}