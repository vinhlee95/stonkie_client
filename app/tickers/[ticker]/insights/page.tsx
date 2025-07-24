import { redirect } from 'next/navigation'

export default function InsightsPage({ params }: { params: Promise<{ ticker: string }> }) {
  // Await the params to get the ticker
  return params.then(({ ticker }) => {
    redirect(`/tickers/${ticker}/insights/growth`)
  })
}
