import { Suspense } from "react";
import KeyStats, {KeyStatsType} from "./KeyStats";
import GrowthChart from "./GrowthChart";
import EpsChart from "./EpsChart";
import DebtCoverageChart from "./DebtCoverageChart";
import TabNavigation from "./TabNavigation";

export default async function TickerDetails({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  
  const keyStatsResponse = await fetch(`${process.env.BACKEND_URL}/api/companies/${ticker.toLocaleLowerCase()}/key-stats`, {
    // Cache for 15 minutes
    next: {revalidate: 15*60}
  })
  const keyStats = (await keyStatsResponse.json()).data as KeyStatsType
  
  const tabs = [
    { label: 'Overview', path: `/tickers/${ticker}` },
    { label: 'Financial statements', path: `/tickers/${ticker}/statements` },
    { label: 'Revenue', path: `/tickers/${ticker}/revenue` },
  ];

  return (
    <div className="p-4">
      <TabNavigation tabs={tabs} />
      <KeyStats keyStats={keyStats} />
      <Suspense fallback={<p>Loading growth chart...</p>}>
        <GrowthChart ticker={ticker} />
      </Suspense>
      <Suspense fallback={<p>Loading EPS chart...</p>}>
        <EpsChart ticker={ticker} />
      </Suspense>
      <Suspense fallback={<p>Loading Debt and coverage chart...</p>}>
        <DebtCoverageChart ticker={ticker} />
      </Suspense>
    </div>
  )
} 