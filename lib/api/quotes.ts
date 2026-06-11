/**
 * Daily price change quotes from the backend batch endpoint
 * GET /api/quotes/price-changes?tickers=AAPL,MSFT
 *
 * Semantics: change is for the latest *completed* trading day (close vs
 * previous close) per exchange — not live intraday. Failed/unknown tickers
 * are silently omitted from `quotes`.
 */

export interface PriceChange {
  trading_date: string
  close: number
  prev_close: number
  change: number
  change_percent: number
  currency: string | null
}

export interface PriceChangesResponse {
  quotes: Record<string, PriceChange>
}

/** Backend caps a single batch request at 50 tickers. */
export const PRICE_CHANGES_MAX_TICKERS = 50

export async function fetchPriceChanges(tickers: string[]): Promise<PriceChangesResponse> {
  const res = await fetch(
    `/api/quotes/price-changes?tickers=${encodeURIComponent(tickers.join(','))}`,
  )
  if (!res.ok) throw new Error(`Failed to fetch price changes (${res.status})`)
  return (await res.json()) as PriceChangesResponse
}
