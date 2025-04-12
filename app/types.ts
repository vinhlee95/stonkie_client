export type CompanyFinancialStatement = {
  period_end_year: number
  income_statement: Record<string, number | null>
  balance_sheet: Record<string, number | null>
  cash_flow: Record<string, number | null>
}

export type FinancialStatement = {
  period_end_year: number;
  period_type: 'annually' | 'quarterly';
  is_ttm: boolean;
  data: Record<string, number | null>;
}
