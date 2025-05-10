import { AnnualFinancialStatement, QuarterlyFinancialStatement } from "@/app/types";

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

export interface ChartDatasetDefinition { // Renamed to avoid conflict if ChartDataset is a global type
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

export interface ChartDataOutput {
  labels: string[];
  datasets: ChartDatasetDefinition[];
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

// Helper function to process annual statements
export function processAnnualStatements(statements: AnnualFinancialStatement[]): {
  generatedLabels: string[];
  sortedStatements: AnnualFinancialStatement[];
} {
  const sortedAnnual = [...statements].sort((a, b) => a.period_end_year - b.period_end_year);
  const generatedLabels = sortedAnnual.map(s => 
    s.is_ttm ? 'TTM' : s.period_end_year.toString()
  );
  return { generatedLabels, sortedStatements: sortedAnnual };
}

// Helper function to process quarterly statements
export function processQuarterlyStatements(statements: QuarterlyFinancialStatement[]): {
  generatedLabels: string[];
  sortedStatements: QuarterlyFinancialStatement[];
} {
  const sortedQuarterly = [...statements].sort((a, b) => 
    new Date(a.period_end_quarter).getTime() - new Date(b.period_end_quarter).getTime()
  );
  const generatedLabels = sortedQuarterly.map(s => {
    const yyyymmddDate = convertToYYYYMMDD(s.period_end_quarter);
    return formatQuarterLabel(yyyymmddDate);
  });
  return { generatedLabels, sortedStatements: sortedQuarterly };
}

export const parseFinancialValue = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    const num = parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
    return isNaN(num) ? 0 : num;
  };
