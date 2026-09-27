/**
 * Placeholder data for dashboard sections that have no backend source yet
 * (performance history, risk, news, events, dividends).
 * Every card that renders this data shows a "Sample data" badge.
 */

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** Random walk of n points ending at endRet, used for sample charts. */
export function walk(n: number, seed: number, endRet: number, vol: number): number[] {
  const r = rng(seed)
  const out = [0]
  let v = 0
  for (let i = 1; i < n; i++) {
    v += (r() - 0.5) * vol
    out.push(v)
  }
  const drift = endRet - out[n - 1]
  return out.map((x, i) => x + drift * (i / (n - 1)))
}

export interface SeriesPoint {
  d: Date
  p: number
  b: number
}

/** ~2y of cumulative % returns: portfolio (p) vs S&P 500 (b). */
// Fixed end date so SSR and hydration build identical series (no new Date()).
const SAMPLE_SERIES_END = new Date(Date.UTC(2026, 8, 25))

export function sampleSeries(end: Date = SAMPLE_SERIES_END): SeriesPoint[] {
  const n = 504
  const p = walk(n, 7, 61, 3.2)
  const b = walk(n, 19, 29, 1.6)
  const start = end.getTime() - 730 * 864e5
  return p.map((v, i) => ({ d: new Date(start + i * (730 / n) * 864e5), p: v, b: b[i] }))
}

export const RANGES = { '1M': 21, '3M': 63, YTD: 186, '1Y': 252, All: 504 } as const
export type RangeKey = keyof typeof RANGES

export function sampleSpark(ticker: string, up: boolean): number[] {
  const seed = [...ticker].reduce((a, c) => a + c.charCodeAt(0), 0)
  return walk(30, seed, (up ? 1 : -1) * 6 + (seed % 5) - 2, 3)
}

export interface NewsItem {
  tickers: string[]
  source: string
  ago: string
  sentiment: 'up' | 'down' | 'neutral'
  headline: string
}

export const SAMPLE_NEWS: NewsItem[] = [
  {
    tickers: ['TSLA'],
    source: 'Tradingkey',
    ago: '2h',
    sentiment: 'down',
    headline: 'Tesla slides as investors sell the news on record Q3 deliveries',
  },
  {
    tickers: ['AAPL'],
    source: 'CNBC',
    ago: '3h',
    sentiment: 'up',
    headline: 'Apple jumps on stronger iPhone 17 sell-through in China and India',
  },
  {
    tickers: ['DELL', 'NVDA'],
    source: 'Markets',
    ago: '5h',
    sentiment: 'down',
    headline: 'AI server names pull back after Dell flags tighter margins on GPU racks',
  },
  {
    tickers: ['MSFT'],
    source: 'Finance',
    ago: '1d',
    sentiment: 'neutral',
    headline: 'Microsoft sets Azure pricing changes ahead of October earnings',
  },
]

export interface EventItem {
  date: string
  daysAway: number
  type: 'earnings' | 'dividend'
  ticker: string
  detail: string
}

export const SAMPLE_EVENTS: EventItem[] = [
  { date: 'Sep 29', daysAway: 2, type: 'dividend', ticker: 'VOO', detail: '$1.80 / sh · pay date' },
  { date: 'Oct 6', daysAway: 9, type: 'dividend', ticker: 'JPM', detail: '$1.40 / sh · ex-date' },
  { date: 'Oct 21', daysAway: 24, type: 'earnings', ticker: 'TSLA', detail: 'Q3 · after close' },
  {
    date: 'Oct 27',
    daysAway: 30,
    type: 'earnings',
    ticker: 'MSFT',
    detail: 'Q1 FY27 · after close',
  },
  { date: 'Oct 29', daysAway: 32, type: 'earnings', ticker: 'AAPL', detail: 'Q4 · after close' },
]

export const SAMPLE_DIV_MONTHS = ['O', 'N', 'D', 'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S']
export const SAMPLE_DIV_RECEIVED = [38, 22, 61, 34, 18, 412, 44, 26, 58, 36, 20, 61]
export const SAMPLE_DIV_PAYERS = [
  { ticker: 'VOO', yieldPct: 1.19, forward: 87 },
  { ticker: 'JPM', yieldPct: 1.86, forward: 97 },
  { ticker: 'MSFT', yieldPct: 0.71, forward: 56 },
]

export const SAMPLE_RISK = { beta: 1.34, vol: 24.6, mdd: -18.2 }
