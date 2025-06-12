import InsightChatModal from './InsightChatModal';
import ClientInsightsFallback from './ClientInsightsFallback';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

enum InsightType {
  GROWTH = "growth",
  EARNINGS = "earnings",
  CASH_FLOW = "cash_flow"
}

interface Insight {
  title: string;
  content: string;
  slug: string;
  thumbnail_url: string;
}

interface InsightsPageProps {
  searchParams: Promise<{ type?: string }>;
  params: Promise<{ ticker: string }>;
}

export default async function InsightsPage({ searchParams, params }: InsightsPageProps) {
  const {type} = await searchParams
  const {ticker} = await params
  const insightType = Object.values(InsightType).includes(type as InsightType) ? type as string : InsightType.GROWTH;

  let insights: Insight[] = [];
  let fetchError = false;
  try {
    const res = await fetch(`${BACKEND_URL}/api/companies/${ticker}/insights/${insightType}?stream=${false}`);
    if (res.ok) {
      insights = (await res.json()).data;
    } else {
      fetchError = true;
    }
  } catch {
    fetchError = true;
  }

  if (!insights || insights.length === 0 || fetchError) {
    return <ClientInsightsFallback ticker={ticker} insightType={insightType} />;
  }

  return <InsightChatModal insights={insights} ticker={ticker} />;
}