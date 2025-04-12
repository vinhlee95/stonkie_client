export type CompanyFinancialStatement = {
  period_end_year: number
  income_statement: Record<string, number | null>
  balance_sheet: Record<string, number | null>
  cash_flow: Record<string, number | null>
}

export type FinancialStatement = {
  year: number;
  data: Record<string, number | null>;
}
