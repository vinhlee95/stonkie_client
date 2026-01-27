import { Company } from '@/app/CompanyList'
import ClientInsightsFallback from '../ClientInsightsFallback'
import InsightChatModal from '../InsightChatModal'
import InsightTypeTab from '../InsightTypeTab'
import { InsightType } from '../constants'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export const revalidate = 120

// Pre-render popular ticker pages at build time for even faster initial loads.
export async function generateStaticParams() {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/api/companies/most-viewed`)
    if (!response.ok) {
      return []
    }

    const data = (await response.json()).data as Company[]

    // Generate all combinations of ticker and insight type
    return data.flatMap((company) =>
      Object.values(InsightType).map((type) => ({ ticker: company.ticker, type })),
    )
  } catch (error) {
    console.error('Failed to fetch most-viewed companies for generateStaticParams:', error)
    return []
  }
}

interface Insight {
  title: string
  content: string
  slug: string
  thumbnail_url: string
}

interface InsightsPageProps {
  params: Promise<{ ticker: string; type: InsightType }>
}

export default async function InsightsPage({ params }: InsightsPageProps) {
  const { ticker, type } = await params
  const insightType = Object.values(InsightType).includes(type) ? type : InsightType.GROWTH

  let insights: Insight[] = []
  let fetchError = false
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/companies/${ticker}/insights/${insightType}?stream=${false}`,
    )
    if (res.ok) {
      insights = (await res.json()).data
    } else {
      fetchError = true
    }
  } catch (error) {
    console.error(`Failed to fetch insights for ticker ${ticker}, type ${insightType}:`, error)
    fetchError = true
  }

  // Render the chip selector above the main content
  return (
    <>
      <InsightTypeTab currentType={insightType} ticker={ticker} />
      {!insights || insights.length === 0 || fetchError ? (
        <ClientInsightsFallback ticker={ticker} insightType={insightType} />
      ) : (
        <InsightChatModal insights={insights} ticker={ticker} />
      )}
    </>
  )
}
