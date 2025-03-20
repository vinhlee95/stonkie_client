import { Suspense } from "react";
import KeyStats, {KeyStatsType} from "./KeyStats";
import GrowthChart from "./GrowthChart";

export default async function TickerDetails({ params }: { params: { ticker: string } }) {
  const { ticker } = await params;
  
  const keyStatsResponse = await fetch(`${process.env.BACKEND_URL}/api/companies/${ticker.toLocaleLowerCase()}/key-stats`, {
    // Cache for 15 minutes
    next: {revalidate: 15*60}
  })
  const keyStats = (await keyStatsResponse.json()).data as KeyStatsType

  return (
    <>
      <KeyStats keyStats={keyStats} />
      <Suspense fallback={<p>Loading growth chart...</p>}>
        <GrowthChart ticker={ticker} />
      </Suspense>
    </>
  )
} 