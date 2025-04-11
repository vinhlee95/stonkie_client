import { Suspense } from "react";
import KeyStats, {KeyStatsType} from "./KeyStats";
import GrowthChart from "./GrowthChart";
import EpsChart from "./EpsChart";
import DebtCoverageChart from "./DebtCoverageChart";

type FinancialStatement = {
  period_end_year: number
  income_statement: Record<string, number | null>
  balance_sheet: Record<string, number | null>
  cash_flow: Record<string, number | null>
}

export default async function TickerDetails({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  
  const keyStatsResponse = await fetch(`${process.env.BACKEND_URL}/api/companies/${ticker.toLocaleLowerCase()}/key-stats`, {
    next: {revalidate: 15*60}
  })
  const keyStats = keyStatsResponse.status === 200 ? (await keyStatsResponse.json()).data as KeyStatsType : null

  const statementsResponse = await fetch(`${process.env.BACKEND_URL}/api/companies/${ticker.toLocaleLowerCase()}/statements`, {
    next: {revalidate: 15*60}
  })
  
  const statements = statementsResponse.status === 200 ? await statementsResponse.json() as FinancialStatement[] : null
  const incomeStatements = statements && statements.length > 0 ? statements.map((statement) => ({
    year: statement.period_end_year,
    data: statement.income_statement
  })) : null

  return (
    <>
      {keyStats && <KeyStats keyStats={keyStats} />}
      <Suspense fallback={<p>Loading growth chart...</p>}>
        {incomeStatements && <GrowthChart incomeStatements={incomeStatements} />}
      </Suspense>
      <Suspense fallback={<p>Loading EPS chart...</p>}>
        <EpsChart ticker={ticker} />
      </Suspense>
      <Suspense fallback={<p>Loading Debt and coverage chart...</p>}>
        <DebtCoverageChart ticker={ticker} />
      </Suspense>
    </>
  )
} 