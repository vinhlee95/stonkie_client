import type { PerformancePoint } from '@/lib/api/portfolio'

/**
 * Range math for the performance chart and the hero "Return". The backend
 * sends ~5y of daily EUR values once; every range is a slice of it, rebased
 * so both lines start at 0%.
 */
export const RANGE_KEYS = ['1M', '3M', 'YTD', '1Y', 'All'] as const
export type RangeKey = (typeof RANGE_KEYS)[number]

/** Performance history query state, shared by the hero Return and the chart. */
export interface PerformanceState {
  points: PerformancePoint[] | undefined
  /** Holdings left out of the series (no currency, price history or FX). */
  excluded: string[]
  status: 'pending' | 'error' | 'success'
}

export interface ChartPoint {
  d: Date
  /** Portfolio return since the range start, in %. */
  p: number
  /** S&P 500 return since the range start, in %. */
  b: number
}

const MONTHS_BACK: Partial<Record<RangeKey, number>> = { '1M': 1, '3M': 3, '1Y': 12 }

/** ISO date `months` before `iso`, clamped to month end (31 Mar − 1M = 28/29 Feb). */
function monthsBefore(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const total = y * 12 + (m - 1) - months
  const year = Math.floor(total / 12)
  const month = (total % 12) + 1
  const day = Math.min(d, new Date(Date.UTC(year, month, 0)).getUTCDate())
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Index of the range's base point: the last close on or before the cutoff.
 * YTD is based on the prior year's last close. Falls back to the first
 * point when the history is shorter than the range.
 */
export function rangeStartIndex(points: PerformancePoint[], range: RangeKey): number {
  if (range === 'All' || points.length === 0) return 0
  const last = points[points.length - 1].date
  const cutoff =
    range === 'YTD'
      ? `${Number(last.slice(0, 4)) - 1}-12-31`
      : monthsBefore(last, MONTHS_BACK[range]!)
  // ISO dates compare correctly as strings.
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].date <= cutoff) return i
  }
  return 0
}

/** The range's points rebased to 0% at its first point. */
export function sliceAndRebase(points: PerformancePoint[], range: RangeKey): ChartPoint[] {
  const slice = points.slice(rangeStartIndex(points, range))
  if (slice.length === 0) return []
  const { portfolio_value: p0, benchmark_value: b0 } = slice[0]
  return slice.map((pt) => ({
    d: new Date(`${pt.date}T00:00:00Z`),
    p: (pt.portfolio_value / p0 - 1) * 100,
    b: (pt.benchmark_value / b0 - 1) * 100,
  }))
}

/** Portfolio gain over the range, in base currency and %; null when the range has under two points. */
export function rangeReturn(
  points: PerformancePoint[],
  range: RangeKey,
): { abs: number; pct: number } | null {
  const startIndex = rangeStartIndex(points, range)
  // One point measures no change; the chart shows "not enough history" for the same data.
  if (startIndex >= points.length - 1) return null
  const start = points[startIndex].portfolio_value
  const end = points[points.length - 1].portfolio_value
  return { abs: end - start, pct: (end / start - 1) * 100 }
}

const TICK_STEPS = [5, 10, 20, 25, 50, 100, 200, 500, 1000]

/**
 * Gridline step (in % points) for a y-span. Multi-year ranges can span 100%+,
 * so the count is capped by chart height to keep labels from overlapping.
 */
export function tickStep(span: number, height: number): number {
  const minStep = span > 40 ? 20 : span > 16 ? 10 : 5
  const maxTicks = height < 200 ? 4 : 6
  const step = TICK_STEPS.find((s) => s >= minStep && span / s <= maxTicks)
  if (step) return step
  // Beyond the fixed steps: smallest 1/2/5 x 10^n that still respects the cap.
  const raw = span / maxTicks
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  return [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw)!
}

/** Tooltip/caption for back-tested figures, naming holdings missing from them. */
export function backTestNote(excluded: string[]): string {
  const base = "Based on current holdings: today's shares at past closing prices"
  return excluded.length
    ? `${base}. Excludes ${excluded.join(', ')} (pricing data unavailable).`
    : base
}
