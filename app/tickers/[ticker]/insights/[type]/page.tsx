import { Company } from "@/app/CompanyList";
import ClientInsightsFallback from "../ClientInsightsFallback";
import InsightChatModal from "../InsightChatModal";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

enum InsightType {
  GROWTH = "growth",
  EARNINGS = "earnings",
  CASH_FLOW = "cash_flow"
}

export const revalidate = 120;

// Pre-render popular ticker pages at build time for even faster initial loads.
export async function generateStaticParams() {
  const response = await fetch(`${process.env.BACKEND_URL}/api/companies/most-viewed`);
  if (!response.ok) {
    return [];
  }

  const data = (await response.json()).data as Company[];

  // Generate all combinations of ticker and insight type
  return data.flatMap(company =>
    Object.values(InsightType).map(type => ({ ticker: company.ticker, type }))
  );
}

interface Insight {
  title: string;
  content: string;
  slug: string;
  thumbnail_url: string;
}

interface InsightsPageProps {
  params: Promise<{ ticker: string, type: InsightType }>;
}

export default async function InsightsPage({ params }: InsightsPageProps) {
  const {ticker, type} = await params
  const insightType = Object.values(InsightType).includes(type) ? type : InsightType.GROWTH;

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