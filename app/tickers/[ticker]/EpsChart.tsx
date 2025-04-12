import FinancialChart from "@/app/components/FinancialChart";
import { FinancialStatement } from "@/app/types";

export default async function EpsChart({incomeStatements}: {incomeStatements: FinancialStatement[]}) {
  // Sort income statements by year in ascending order
  const sortedStatements = [...incomeStatements].sort((a, b) => a.year - b.year);
  
  // Find EPS keys from the first statement (should be consistent across years)
  const firstStatement = sortedStatements[0];
  const basicEpsKey = Object.keys(firstStatement.data).find(key => 
    key.toLowerCase().includes('basic eps')
  );
  const dilutedEpsKey = Object.keys(firstStatement.data).find(key => 
    key.toLowerCase().includes('diluted eps')
  );

  if (!basicEpsKey || !dilutedEpsKey) return null;

  const years = sortedStatements.map(statement => statement.year.toString());
  
  const datasets = [
    {
      type: 'bar' as const,
      label: 'Basic EPS',
      data: sortedStatements.map(statement => 
        parseFloat((statement.data[basicEpsKey] ?? 0).toString())
      ),
      backgroundColor: '#4287f5',
      borderColor: '#4287f5',
      borderWidth: 0,
      borderRadius: 4,
      yAxisID: 'y',
    },
    {
      type: 'bar' as const,
      label: 'Diluted EPS',
      data: sortedStatements.map(statement => 
        parseFloat((statement.data[dilutedEpsKey] ?? 0).toString())
      ),
      backgroundColor: '#63e6e2',
      borderColor: '#63e6e2',
      borderWidth: 0,
      borderRadius: 4,
      yAxisID: 'y',
    }
  ];

  return (
    <FinancialChart
      title="Earnings Per Share"
      labels={years}
      datasets={datasets}
      yAxisConfig={{ formatAsCurrency: true }}
    />
  );
}