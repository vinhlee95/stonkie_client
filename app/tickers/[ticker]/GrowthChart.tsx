import { AnnualFinancialStatement, FinancialStatement, isAnnualStatement, isQuarterlyStatement, QuarterlyFinancialStatement} from "@/app/types";
import ChartWithPeriod from "@/app/components/FinancialChart";
import { ChartDataOutput, ChartDatasetDefinition, parseFinancialValue, processAnnualStatements, processQuarterlyStatements } from "./chartUtils";

function getChartDataset(
  statements: Array<FinancialStatement>
): ChartDataOutput {
  if (!statements || statements.length === 0) {
    return { labels: [], datasets: [] };
  }

  let sortedAndProcessedStatements: AnnualFinancialStatement[] | QuarterlyFinancialStatement[];
  let generatedLabels: string[];

  if (isAnnualStatement(statements[0])) {
    const { generatedLabels: annualLabels, sortedStatements: annualSorted } = processAnnualStatements(statements as AnnualFinancialStatement[]);
    generatedLabels = annualLabels;
    sortedAndProcessedStatements = annualSorted;
  } else if (isQuarterlyStatement(statements[0])) {
    const { generatedLabels: quarterlyLabels, sortedStatements: quarterlySorted } = processQuarterlyStatements(statements as QuarterlyFinancialStatement[]);
    generatedLabels = quarterlyLabels;
    sortedAndProcessedStatements = quarterlySorted;
  } else {
    // This case should ideally not be reached if statements are valid FinancialStatement objects
    // and the array is not empty.
    console.error("Unknown or mixed statement types in getChartDataset", statements[0]);
    return { labels: [], datasets: [] };
  }

  const firstStatementData = sortedAndProcessedStatements[0]?.data;
  if (!firstStatementData) return { labels: generatedLabels, datasets: [] }; // Return labels even if data is missing

  const revenueKey = Object.keys(firstStatementData).find(key => 
    key.toLowerCase().includes('revenue')
  );
  
  const netIncomeKey = Object.keys(firstStatementData).find(key => 
    key.toLowerCase().includes('net income')
  );

  if (!revenueKey || !netIncomeKey) {
    console.warn("Revenue or Net Income key not found in statement data.");
    return { labels: generatedLabels, datasets: [] };
  }

  const netMarginData = sortedAndProcessedStatements.map(statement => {
    const revenue = parseFinancialValue(statement.data[revenueKey!]); // Added non-null assertion after check
    const income = parseFinancialValue(statement.data[netIncomeKey!]); // Added non-null assertion after check
    if (revenue === 0) return 0;
    return Number(((income / revenue) * 100).toFixed(2));
  });

  const datasets: ChartDatasetDefinition[] = [
    {
      type: 'bar' as const,
      label: 'Revenue',
      data: sortedAndProcessedStatements.map(statement => 
        parseFinancialValue(statement.data[revenueKey!]) * 1000 // Added non-null assertion
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
      data: sortedAndProcessedStatements.map(statement => 
        parseFinancialValue(statement.data[netIncomeKey!]) * 1000 // Added non-null assertion
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
  return { labels: generatedLabels, datasets };
}

export default async function GrowthChart({ticker: _ticker, incomeStatements: annualStatements}: {ticker: string, incomeStatements: AnnualFinancialStatement[]}) {
  const URL = `${process.env.BACKEND_URL}/api/companies/${_ticker.toLowerCase()}/statements?report_type=income_statement&period_type=quarterly`; 
  const res = await fetch(URL, { next: { revalidate: 15 * 60 } });
  const quarterlyStatements = await res.json() as QuarterlyFinancialStatement[];

  const annualData = getChartDataset(annualStatements);
  const quarterlyData = getChartDataset(quarterlyStatements);

  return (
    <ChartWithPeriod
      title="Growth and Profitability"
      labels={annualData.labels}
      datasets={annualData.datasets}
      quaterlyDatasets={quarterlyData.datasets}
      quarterlyLabels={quarterlyData.labels}
      yAxisConfig={{ formatAsCurrency: true, showPercentage: true }}
    />
  );
}