import { describe, expect, it } from 'vitest'
import type { PerformancePoint } from '@/lib/api/portfolio'
import {
  backTestNote,
  rangeReturn,
  rangeStartIndex,
  sliceAndRebase,
  tickStep,
  type RangeKey,
} from '../performance'

const pt = (date: string, portfolio_value: number, benchmark_value = 100): PerformancePoint => ({
  date,
  portfolio_value,
  benchmark_value,
})

// Sparse sessions are enough: cutoffs pick the last point on or before a date.
const POINTS = [
  pt('2025-03-31', 80, 50),
  pt('2025-09-30', 90, 60),
  pt('2025-10-02', 100, 80),
  pt('2025-12-30', 110, 90),
  pt('2025-12-31', 120, 100), // last close of 2025
  pt('2026-01-02', 130, 101),
  pt('2026-07-01', 140, 105),
  pt('2026-08-31', 150, 110),
  pt('2026-09-02', 160, 115),
  pt('2026-10-02', 180, 120),
]
const startDate = (range: RangeKey, points = POINTS) => points[rangeStartIndex(points, range)].date

describe('rangeStartIndex', () => {
  it('bases each range on the last close on or before its cutoff', () => {
    expect(startDate('1M')).toBe('2026-09-02') // cutoff 2026-09-02
    expect(startDate('3M')).toBe('2026-07-01') // cutoff 2026-07-02
    expect(startDate('1Y')).toBe('2025-10-02') // cutoff 2025-10-02 is a session
  })

  it('YTD is based on the prior year-end close', () => {
    expect(startDate('YTD')).toBe('2025-12-31')
  })

  it('All starts at the first point', () => {
    expect(rangeStartIndex(POINTS, 'All')).toBe(0)
  })

  it('clamps month arithmetic to month end', () => {
    const points = [pt('2026-02-27', 1), pt('2026-02-28', 2), pt('2026-03-31', 3)]
    expect(startDate('1M', points)).toBe('2026-02-28')
  })

  it('falls back to the first point when history is shorter than the range', () => {
    const points = [pt('2026-06-01', 1), pt('2026-10-02', 2)]
    expect(startDate('1Y', points)).toBe('2026-06-01')
    expect(startDate('YTD', points)).toBe('2026-06-01')
  })

  it('handles no points', () => {
    expect(rangeStartIndex([], '1M')).toBe(0)
  })
})

describe('sliceAndRebase', () => {
  it('rebases both lines to 0% at the range start by ratio', () => {
    const data = sliceAndRebase(POINTS, 'YTD')
    expect(data.map((d) => d.d.toISOString().slice(0, 10))).toEqual([
      '2025-12-31',
      '2026-01-02',
      '2026-07-01',
      '2026-08-31',
      '2026-09-02',
      '2026-10-02',
    ])
    expect(data[0]).toMatchObject({ p: 0, b: 0 })
    expect(data.at(-1)!.p).toBeCloseTo(50) // 180 / 120 − 1
    expect(data.at(-1)!.b).toBeCloseTo(20) // 120 / 100 − 1
  })

  it('is empty without points', () => {
    expect(sliceAndRebase([], 'All')).toEqual([])
  })
})

describe('rangeReturn', () => {
  it('is the value change since the range start', () => {
    expect(rangeReturn(POINTS, 'YTD')).toEqual({ abs: 60, pct: 50 })
    expect(rangeReturn(POINTS, 'All')!.abs).toBe(100)
  })

  it('is null when the range has a single point', () => {
    expect(rangeReturn([pt('2026-10-02', 5)], 'YTD')).toBeNull()
  })

  it('is null without points', () => {
    expect(rangeReturn([], '1M')).toBeNull()
  })
})

describe('tickStep', () => {
  it('keeps the original steps for small spans', () => {
    expect(tickStep(10, 250)).toBe(5)
    expect(tickStep(30, 250)).toBe(10)
    expect(tickStep(60, 250)).toBe(20)
  })

  it('caps gridlines for 100%+ spans, tighter on short charts', () => {
    expect(tickStep(180, 250)).toBe(50) // 180 / 50 = 3.6 lines; 25 would give 7.2 > 6
    expect(tickStep(180, 150)).toBe(50) // 4 lines max
    expect(tickStep(90, 150)).toBe(25) // 3.6 lines; 20 would give 4.5 > 4
  })

  it('keeps the gridline cap for spans beyond the fixed steps', () => {
    for (const [span, height, max] of [
      [50000, 250, 6],
      [7000, 250, 6],
      [5000, 150, 4],
    ]) {
      expect(span / tickStep(span, height)).toBeLessThanOrEqual(max)
    }
    expect(tickStep(50000, 250)).toBe(10000)
  })
})

describe('backTestNote', () => {
  it('names excluded holdings', () => {
    expect(backTestNote([])).not.toMatch(/Excludes/)
    expect(backTestNote(['ZZZ', 'QQQ.L'])).toMatch(
      /Excludes ZZZ, QQQ\.L \(pricing data unavailable\)\.$/,
    )
  })
})
