/**
 * Signed-in user's portfolio. Browser calls go through the BFF routes under
 * /api/me/portfolio (which mint the backend JWT); server components call the
 * backend directly via authedBackendFetch.
 *
 * All aggregate values are in `base_currency` (EUR). `price` and `avg_cost`
 * are in the holding's native `currency`. Holdings Yahoo can't price have
 * null values and are excluded from totals.
 */

export interface PortfolioHolding {
  ticker: string
  name: string | null
  shares: number
  avg_cost: number
  currency: string | null
  price: number | null
  day_change_percent: number | null
  trading_date: string | null
  fx_rate: number | null
  value: number | null
  cost_basis: number | null
  day_change: number | null
  total_return: number | null
  total_return_percent: number | null
  weight: number | null
}

export interface PortfolioSummary {
  holdings_count: number
  priced_count: number
  total_value: number
  total_cost: number
  total_return: number
  total_return_percent: number
  day_change: number
  day_change_percent: number
  as_of: string | null
}

export interface Portfolio {
  base_currency: string
  summary: PortfolioSummary
  holdings: PortfolioHolding[]
}

export interface HoldingInput {
  shares: number
  avg_cost: number
  name?: string | null
}

export const PORTFOLIO_QUERY_KEY = ['portfolio'] as const

async function errorDetail(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown; error?: unknown }
    if (typeof body.detail === 'string') return body.detail
    if (typeof body.error === 'string') return body.error
  } catch {
    // fall through
  }
  return `Request failed (${res.status})`
}

export async function fetchPortfolio(): Promise<Portfolio> {
  const res = await fetch('/api/me/portfolio', { cache: 'no-store' })
  if (!res.ok) throw new Error(await errorDetail(res))
  return (await res.json()) as Portfolio
}

export async function saveHolding(ticker: string, input: HoldingInput): Promise<void> {
  const res = await fetch(`/api/me/portfolio/holdings/${encodeURIComponent(ticker)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await errorDetail(res))
}

export async function removeHolding(ticker: string): Promise<void> {
  const res = await fetch(`/api/me/portfolio/holdings/${encodeURIComponent(ticker)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(await errorDetail(res))
}
