import KeyStats, {KeyStatsType} from "./KeyStats";
import GrowthChart from "./GrowthChart";

export default async function TickerDetails({ params }: { params: { ticker: string } }) {
  const { ticker } = await params;
  
  const keyStatsResponse = await fetch(`${process.env.BACKEND_URL}/api/companies/${ticker.toLocaleLowerCase()}/key-stats`, {
    // Cache for 15 minutes
    next: {revalidate: 15*60}
  })
  const keyStats = (await keyStatsResponse.json()).data as KeyStatsType

  const FINANCIAL_DATA_TYPES = ['income_statement', 'balance_sheet', 'cash_flow']
  const allFinancialResponses = await Promise.all(FINANCIAL_DATA_TYPES.map((type) => fetch(`${process.env.BACKEND_URL}/api/financial-data/${ticker.toLowerCase()}/${type}`)))
  const [incomeStatement, balanceSheet, cashFlow] = await Promise.all(allFinancialResponses.map(res => res.json()))

  return (
    <>
      <KeyStats keyStats={keyStats} />
      <GrowthChart data={incomeStatement} />
    </>
  )
} 