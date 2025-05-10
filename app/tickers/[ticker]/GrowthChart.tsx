import { AnnualFinancialStatement, FinancialStatement, isAnnualStatement, isQuarterlyStatement, QuarterlyFinancialStatement } from "@/app/types";
import ChartWithPeriod from "@/app/components/FinancialChart";

// Helper to format date string "YYYY-MM-DD" to "QX YYYY"
function formatQuarterLabel(dateString: string): string {
  if (!dateString || typeof dateString !== 'string') return 'Invalid Date';
  const parts = dateString.split('-'); // Expects "YYYY-MM-DD"
  if (parts.length !== 3) return 'Invalid Date Format';

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);

  if (isNaN(year) || isNaN(month)) return 'Invalid Date Parts';

  let quarter;
  if (month <= 3) quarter = 1;
  else if (month <= 6) quarter = 2;
  else if (month <= 9) quarter = 3;
  else quarter = 4;
  return `Q${quarter} ${year}`;
}

interface ChartDatasetDefinition { // Renamed to avoid conflict if ChartDataset is a global type
  type: 'bar' | 'line';
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor: string;
  borderWidth?: number;
  borderRadius?: number;
  yAxisID?: string;
  pointBackgroundColor?: string;
  pointRadius?: number;
  pointHoverRadius?: number;
  fill?: boolean;
  tension?: number;
}

interface ChartDataOutput {
  labels: string[];
  datasets: ChartDatasetDefinition[];
}

function getChartDataset(
  statements: Array<FinancialStatement>
): ChartDataOutput {
  if (!statements || statements.length === 0) {
    return { labels: [], datasets: [] };
  }

  // Helper to convert 'M/D/YYYY' or 'MM/DD/YYYY' to 'YYYY-MM-DD'
  const convertToYYYYMMDD = (dateStr: string): string => {
    if (!dateStr || typeof dateStr !== 'string') {
      return ''; // Invalid input
    }
    const parts = dateStr.split('/');
    if (parts.length !== 3) {
      return ''; // Invalid format
    }
    const [monthStr, dayStr, yearStr] = parts;

    // Basic validation for year, month, day parts
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day) ||
        yearStr.length !== 4 || month < 1 || month > 12 || day < 1 || day > 31) {
      return ''; // Invalid date components
    }
    // Ensure month and day are two digits for "YYYY-MM-DD"
    return `${yearStr}-${monthStr.padStart(2, '0')}-${dayStr.padStart(2, '0')}`;
  };

  let sortedAndProcessedStatements: AnnualFinancialStatement[] | QuarterlyFinancialStatement[];
  let generatedLabels: string[];

  if (isAnnualStatement(statements[0])) {
    const annualStatements = statements as AnnualFinancialStatement[];
    const sortedAnnual = [...annualStatements].sort((a, b) => a.period_end_year - b.period_end_year);
    generatedLabels = sortedAnnual.map(s => {
      return s.is_ttm ? 'TTM' : s.period_end_year.toString();
    });
    sortedAndProcessedStatements = sortedAnnual;
  } else if (isQuarterlyStatement(statements[0])) {
    const quarterlyStatements = statements as QuarterlyFinancialStatement[];
    const sortedQuarterly = [...quarterlyStatements].sort((a, b) => {
      // period_end_quarter is like '3/31/2025', new Date() can parse this.
      return new Date(a.period_end_quarter).getTime() - new Date(b.period_end_quarter).getTime();
    });
    generatedLabels = sortedQuarterly.map(s => {
      const yyyymmddDate = convertToYYYYMMDD(s.period_end_quarter);
      return formatQuarterLabel(yyyymmddDate); // formatQuarterLabel expects "YYYY-MM-DD"
    });
    sortedAndProcessedStatements = sortedQuarterly;
  } else {
    // This case should ideally not be reached if statements are valid FinancialStatement objects
    // and the array is not empty.
    console.error("Unknown or mixed statement types in getChartDataset", statements[0]);
    return { labels: [], datasets: [] };
  }

  const firstStatementData = sortedAndProcessedStatements[0]?.data;
  if (!firstStatementData) return { labels: generatedLabels, datasets: [] }; // Return labels even if data is missing

  const revenueKey = Object.keys(firstStatementData).find(key => 
    key.toLowerCase().includes('revenue') && 
    !key.toLowerCase().includes('cost')
  );
  
  const netIncomeKey = Object.keys(firstStatementData).find(key => 
    key.toLowerCase().includes('net income')
  );

  if (!revenueKey || !netIncomeKey) {
    console.warn("Revenue or Net Income key not found in statement data.");
    return { labels: generatedLabels, datasets: [] };
  }

  const parseFinancialValue = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    const num = parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
    return isNaN(num) ? 0 : num;
  };

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

export default async function GrowthChart({ticker: _ticker, incomeStatements}: {ticker: string, incomeStatements: AnnualFinancialStatement[]}) {
  const URL = `${process.env.BACKEND_URL}/api/companies/${_ticker.toLowerCase()}/statements?report_type=income_statement&period_type=quarterly`; 
  const res = await fetch(URL, { next: { revalidate: 15 * 60 } });
  const quarterlyStatements = await res.json() as FinancialStatement[];

  const { labels, datasets } = getChartDataset(incomeStatements);
  const quarterlyData = getChartDataset(quarterlyStatements);

  if (!datasets || datasets.length === 0) return null

  return (
    <ChartWithPeriod
      title="Growth and Profitability"
      labels={labels}
      datasets={datasets}
      quaterlyDatasets={quarterlyData.datasets}
      quarterlyLabels={quarterlyData.labels}
      yAxisConfig={{ formatAsCurrency: true, showPercentage: true }}
    />
  );
}