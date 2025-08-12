export type CompanyFinancialStatement = {
  period_end_year: number
  income_statement: Record<string, number | null>
  balance_sheet: Record<string, number | null>
  cash_flow: Record<string, number | null>
  is_ttm: boolean
}

export type AnnualFinancialStatement = {
  period_end_year: number
  is_ttm: boolean
  data: Record<string, number | null>
}

export type QuarterlyFinancialStatement = {
  period_end_quarter: string
  data: Record<string, number | null>
}

export type FinancialStatement = AnnualFinancialStatement | QuarterlyFinancialStatement

// Type guards
export function isAnnualStatement(
  statement: FinancialStatement,
): statement is AnnualFinancialStatement {
  return 'period_end_year' in statement
}

export function isQuarterlyStatement(
  statement: FinancialStatement,
): statement is QuarterlyFinancialStatement {
  return 'period_end_quarter' in statement
}

//KeyStats type
export type KeyStatsType = {
  name: string
  sector: string
  industry: string
  country: string
  description: string
}
