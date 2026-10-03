/**
 * Signed-in user's portfolio. Browser calls go through the BFF routes under
 * /api/me/portfolio (which mint the backend JWT); server components call the
 * backend directly via authedBackendFetch.
 *
 * All aggregate values are in `base_currency` (EUR). `price` and `avg_cost`
 * are in the holding's native `currency`. Holdings Yahoo can't price have
 * null values and are excluded from totals.
 *
 * Prices are live regular-session quotes, at most 5 min old. A holding without
 * a live quote is priced at its last daily close and flagged `delayed`.
 */

/** One buy of a holding's ticker. */
export interface PortfolioLot {
  id: string
  shares: number
  /** Price per share in the holding's quote unit, like `avg_cost`. */
  price: number
  /** Purchase date (YYYY-MM-DD), or null when not recorded. */
  purchased_on: string | null
}

export interface PortfolioHolding {
  ticker: string
  name: string | null
  shares: number
  avg_cost: number
  /** Buy lots, newest purchase first, undated last; `shares` and `avg_cost` aggregate them. */
  lots: PortfolioLot[]
  currency: string | null
  price: number | null
  day_change_percent: number | null
  trading_date: string | null
  /** Live quote time (ISO UTC); null when `delayed` or unpriced. */
  as_of: string | null
  delayed: boolean
  fx_rate: number | null
  value: number | null
  cost_basis: number | null
  day_change: number | null
  total_return: number | null
  total_return_percent: number | null
  weight: number | null
  /** Classification for allocation; "Other" when unknown. */
  sector: string
  country: string
  asset_type: AssetType
}

export type AssetType = 'Stock' | 'ETF' | 'Other'

export interface PortfolioSummary {
  holdings_count: number
  priced_count: number
  total_value: number
  total_cost: number
  total_return: number
  total_return_percent: number
  day_change: number
  day_change_percent: number
  /** Newest live quote time (ISO UTC); null when no holding has a live quote. */
  as_of: string | null
  delayed_count: number
}

export interface Portfolio {
  base_currency: string
  summary: PortfolioSummary
  holdings: PortfolioHolding[]
}

export interface LotInput {
  shares: number
  price: number
  purchased_on: string | null
}

/** A lot to add; `name` labels the holding when the ticker is new (null keeps the stored one). */
export type NewLot = LotInput & { name: string | null }

export const PORTFOLIO_QUERY_KEY = ['portfolio'] as const
// Nested under PORTFOLIO_QUERY_KEY so invalidating the portfolio after a write refetches it too
// (usePortfolio.sync, which refetches only its exact key, invalidates it explicitly).
export const PERFORMANCE_QUERY_KEY = [...PORTFOLIO_QUERY_KEY, 'performance'] as const

/** One trading day of the performance history. */
export interface PerformancePoint {
  /** Session date (YYYY-MM-DD). */
  date: string
  /** Current holdings priced at that day's closes and FX, in `base_currency`. */
  portfolio_value: number
  /** S&P 500 level converted at that day's FX; only meaningful relative to itself. */
  benchmark_value: number
}

/**
 * ~5y of daily values, oldest first, ending at the last completed close.
 * Back-tests today's holdings (lot purchase dates are not used). Clients
 * slice and rebase per range. `points` is empty when nothing can be priced.
 */
export interface PortfolioPerformance {
  base_currency: string
  points: PerformancePoint[]
  /** Holdings left out of `portfolio_value` (no currency, history or FX). */
  excluded: string[]
}

/** Yahoo symbols the backend accepts: AAPL, BRK-B, NOKIA.HE, EURUSD=X. Match the backend's TICKER_RE. */
export const TICKER_RE = /^[A-Z0-9][A-Z0-9.\-=^]{0,19}$/

/**
 * A lone comma before exactly 3 digits ('4,123', '0,125') is a thousands
 * separator on US keyboards and a decimal one on EU keyboards; the UI asks
 * the user to disambiguate instead of guessing.
 */
export function isAmbiguousDecimal(input: string): boolean {
  return /^\d{1,3},\d{3}$/.test(input.trim())
}

/**
 * Parse a user-typed positive number. Commas in thousands groups are dropped
 * ('1,000.5', '12,345,678', matching how the UI renders numbers); a single
 * comma with any other grouping is a decimal separator ('2,35', EU keyboards).
 * Returns NaN for ambiguous input (see isAmbiguousDecimal) and anything else,
 * e.g. '1abc', '1.2.3' or '1,000,5'.
 */
export function parseDecimal(input: string): number {
  const s = input.trim()
  if (isAmbiguousDecimal(s)) return NaN
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) return Number(s.replace(/,/g, ''))
  if (/^\d+,\d+$/.test(s)) return Number(s.replace(',', '.'))
  return /^(\d+(\.\d+)?|\.\d+)$/.test(s) ? Number(s) : NaN
}

/**
 * Finnhub writes US share classes with a dot (BRK.B) and Nordic listings with
 * a space (NDA FI.HE, VOLV B.ST); Yahoo, which prices holdings, uses a dash
 * for both (BRK-B, NDA-FI.HE). Only class letters A-C are mapped from dots so
 * single-letter exchange suffixes like VOD.L keep their dot. Only a single
 * space before an exchange-suffixed part is mapped, so company-name searches
 * (APPLE INC) don't turn into ticker-like strings.
 */
export function toYahooSymbol(symbol: string): string {
  return symbol
    .trim()
    .replace(/^([A-Z0-9]+) ([A-Z0-9]+\.[A-Z]+)$/, '$1-$2')
    .replace(/^([A-Z]+)\.([ABC])$/, '$1-$2')
}

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

export async function fetchPerformance(): Promise<PortfolioPerformance> {
  const res = await fetch('/api/me/portfolio/performance', { cache: 'no-store' })
  if (!res.ok) throw new Error(await errorDetail(res))
  return (await res.json()) as PortfolioPerformance
}

export async function removeHolding(ticker: string): Promise<void> {
  const res = await fetch(`/api/me/portfolio/holdings/${encodeURIComponent(ticker)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(await errorDetail(res))
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export async function addLot(ticker: string, input: NewLot): Promise<void> {
  const res = await fetch(`/api/me/portfolio/holdings/${encodeURIComponent(ticker)}/lots`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await errorDetail(res))
}

export async function updateLot(id: string, input: LotInput): Promise<void> {
  const res = await fetch(`/api/me/portfolio/lots/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await errorDetail(res))
}

export async function deleteLot(id: string): Promise<void> {
  const res = await fetch(`/api/me/portfolio/lots/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await errorDetail(res))
}
