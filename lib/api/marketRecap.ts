const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export type RecapCitation = { source_id: string }

export type RecapBullet = {
  text: string
  citations: RecapCitation[]
}

export type RecapSource = {
  id: string
  url: string
  title: string
  publisher: string
  published_at: string
  fetched_at: string
}

export type MarketRecapItem = {
  period_start: string
  period_end: string
  created_at: string
  summary: string
  bullets: RecapBullet[]
  sources: RecapSource[]
}

export type MarketRecapResponse = {
  market: string
  cadence: string
  latest_created_at: string | null
  items: MarketRecapItem[]
}

export const FRONTEND_TO_BACKEND_MARKET = {
  USA: 'US',
  Finland: 'FI',
  Vietnam: 'VN',
} as const

export type FrontendMarketRecapKey = keyof typeof FRONTEND_TO_BACKEND_MARKET

export type MarketRecapPair = {
  daily: MarketRecapItem | null
  weekly: MarketRecapItem | null
}

export type MarketRecapMap = Partial<Record<FrontendMarketRecapKey, MarketRecapPair>>

type GetMarketRecapsArgs = {
  market: string
  cadence?: 'weekly' | string
  limit?: number
  revalidateSeconds?: number
}

export function toBackendMarketCode(frontendMarket: string): string | null {
  if (frontendMarket in FRONTEND_TO_BACKEND_MARKET) {
    return FRONTEND_TO_BACKEND_MARKET[frontendMarket as FrontendMarketRecapKey]
  }
  return null
}

export async function getMarketRecaps({
  market,
  cadence = 'weekly',
  limit = 1,
  revalidateSeconds = 60 * 60,
}: GetMarketRecapsArgs): Promise<MarketRecapResponse> {
  const response = await fetch(
    `${BACKEND_URL}/api/markets/${market}/recaps?cadence=${cadence}&limit=${limit}`,
    {
      next: { revalidate: revalidateSeconds, tags: ['market-recaps'] },
    },
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to fetch market recaps (${response.status}): ${body}`)
  }

  return (await response.json()) as MarketRecapResponse
}

async function fetchLatestForCadence(
  backendMarket: string,
  cadence: 'daily' | 'weekly',
): Promise<MarketRecapItem | null> {
  try {
    const response = await getMarketRecaps({ market: backendMarket, cadence, limit: 1 })
    return response.items[0] ?? null
  } catch {
    return null
  }
}

export async function getLatestRecapPairForFrontendMarket(
  frontendMarket: FrontendMarketRecapKey,
): Promise<MarketRecapPair> {
  const backendMarket = toBackendMarketCode(frontendMarket)
  if (!backendMarket) return { daily: null, weekly: null }

  const [daily, weekly] = await Promise.all([
    fetchLatestForCadence(backendMarket, 'daily'),
    fetchLatestForCadence(backendMarket, 'weekly'),
  ])
  return { daily, weekly }
}
