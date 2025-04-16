import { Suspense } from "react";
import KeyStats, {KeyStatsType} from "./KeyStats";
import GrowthChart from "./GrowthChart";
import EpsChart from "./EpsChart";
import DebtCoverageChart from "./DebtCoverageChart";
import { CompanyFinancialStatement } from "@/app/types";

export default async function TickerDetails({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  
  const keyStatsResponse = await fetch(`${process.env.BACKEND_URL}/api/companies/${ticker.toLocaleLowerCase()}/key-stats`, {
    next: {revalidate: 15*60}
  })
  const keyStats = keyStatsResponse.status === 200 ? (await keyStatsResponse.json()).data as KeyStatsType : null

  const statementsResponse = await fetch(`${process.env.BACKEND_URL}/api/companies/${ticker.toLocaleLowerCase()}/statements`, {
    next: {revalidate: 15*60}
  })
  
  const statements = statementsResponse.status === 200 ? await statementsResponse.json() as CompanyFinancialStatement[] : null
  const incomeStatements = statements && statements.length > 0 ? statements.filter((statement) => statement.income_statement).map((statement) => ({
    period_end_year: statement.period_end_year,
    data: statement.income_statement,
    is_ttm: statement.is_ttm
  })) : null

  const balanceSheet = statements && statements.length > 0 ? statements.filter((statement) => statement.balance_sheet).map((statement) => ({
    period_end_year: statement.period_end_year,
    data: statement.balance_sheet,
    is_ttm: statement.is_ttm
  })) : null

  const cashFlow = statements && statements.length > 0 ? statements.filter((statement) => statement.cash_flow).map((statement) => ({
    period_end_year: statement.period_end_year,
    data: statement.cash_flow,
    is_ttm: statement.is_ttm
  })) : null

  return (
    <>
      {keyStats && <KeyStats keyStats={keyStats} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Suspense fallback={<p>Loading growth chart...</p>}>
          {incomeStatements && incomeStatements.length > 0 && <GrowthChart incomeStatements={incomeStatements} />}
        </Suspense>
        <Suspense fallback={<p>Loading EPS chart...</p>}>
          {incomeStatements && incomeStatements.length > 0 && <EpsChart incomeStatements={incomeStatements} />}
        </Suspense>
        <Suspense fallback={<p>Loading Debt and coverage chart...</p>}>
          {balanceSheet && cashFlow && balanceSheet.length > 0 && cashFlow.length > 0 && <DebtCoverageChart balanceSheet={balanceSheet} cashFlow={cashFlow} />}
        </Suspense>
      </div>
    </>
  )
} 