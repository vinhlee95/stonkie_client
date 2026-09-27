import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PortfolioHolding } from '@/lib/api/portfolio'
import { pct } from '../format'
import { RANGES, sampleSeries, type RangeKey } from '../sampleData'
import {
  Allocation,
  Movers,
  PerformanceChart,
  PortfolioSummary,
  pricedHoldings,
  Risk,
} from '../components/sections'

function holding(over: Partial<PortfolioHolding>): PortfolioHolding {
  return {
    ticker: 'AAPL',
    name: null,
    shares: 1,
    avg_cost: 1,
    currency: 'USD',
    price: 1,
    day_change_percent: 0,
    trading_date: '2026-09-25',
    as_of: null,
    delayed: false,
    fx_rate: 1,
    value: 0,
    cost_basis: 0,
    day_change: 0,
    total_return: 0,
    total_return_percent: 0,
    weight: 0,
    sector: 'Technology',
    country: 'United States',
    asset_type: 'Stock',
    ...over,
  }
}

// AAPL + NOKIA.HE are Technology, JPM Financial Services. ZZZ is unpriced.
const HOLDINGS = [
  holding({
    ticker: 'NOKIA.HE',
    currency: 'EUR',
    country: 'Finland',
    value: 100,
    weight: 10,
    day_change: 10,
    day_change_percent: 1,
  }),
  holding({ ticker: 'AAPL', value: 600, weight: 60, day_change: 200, day_change_percent: 3 }),
  holding({
    ticker: 'JPM',
    sector: 'Financial Services',
    asset_type: 'ETF',
    value: 300,
    weight: 30,
    day_change: -300,
    day_change_percent: -2,
  }),
  holding({ ticker: 'ZZZ', value: null, weight: null, day_change: null, price: null }),
]

function rowText(label: string): string {
  const row = screen.getAllByRole('listitem').find((li) => within(li).queryByText(label))
  return row?.textContent ?? ''
}

describe('pricedHoldings', () => {
  it('drops holdings without a value or weight', () => {
    expect(pricedHoldings(HOLDINGS).map((h) => h.ticker)).toEqual(['NOKIA.HE', 'AAPL', 'JPM'])
  })
})

describe('Allocation', () => {
  it('groups weights by sector, largest first, ignoring unpriced holdings', () => {
    render(<Allocation holdings={HOLDINGS} variant="bars" />)
    const items = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(items).toEqual(['Technology70.0%', 'Financial Services30.0%'])
    expect(screen.queryByText('Sample data')).not.toBeInTheDocument()
  })

  it('regroups by country when toggled', async () => {
    render(<Allocation holdings={HOLDINGS} variant="bars" />)
    await userEvent.click(screen.getByRole('button', { name: 'Country' }))
    const items = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(items).toEqual(['United States90.0%', 'Finland10.0%'])
  })

  it('regroups by asset type when toggled', async () => {
    render(<Allocation holdings={HOLDINGS} variant="bars" />)
    await userEvent.click(screen.getByRole('button', { name: 'Type' }))
    const items = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(items).toEqual(['Stock70.0%', 'ETF30.0%'])
  })

  it('groups holdings missing metadata under Other', () => {
    const legacy = { ...HOLDINGS[1], sector: undefined } as unknown as PortfolioHolding
    render(<Allocation holdings={[legacy, HOLDINGS[2]]} variant="bars" />)
    const items = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(items).toEqual(['Other60.0%', 'Financial Services30.0%'])
  })

  it('renders nothing without priced holdings', () => {
    const { container } = render(<Allocation holdings={[HOLDINGS[3]]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('Risk', () => {
  it('computes concentration and exposure from weights', () => {
    render(<Risk holdings={HOLDINGS} />)
    expect(rowText('Largest position')).toContain('60.0%')
    expect(screen.getByText('AAPL · top 3 = 100%')).toBeInTheDocument()
    expect(rowText('Non-EUR exposure')).toContain('90%')
    expect(rowText('Non-EUR exposure')).toContain('High')
    expect(rowText('Technology exposure')).toBe('Technology exposure70%High')
  })
})

describe('Movers', () => {
  it('orders by absolute € impact and skips unpriced holdings', () => {
    render(<Movers holdings={HOLDINGS} currency="EUR" />)
    const rows = screen.getAllByRole('listitem')
    expect(rows.map((r) => within(r).getAllByText(/^[A-Z.]{2,}$/)[0].textContent)).toEqual([
      'JPM',
      'AAPL',
      'NOKIA.HE',
    ])
    expect(within(rows[0]).getByText('−€300')).toBeInTheDocument()
  })

  it('leaves out priced holdings without a daily change', () => {
    const noClose = holding({ ticker: 'NEW', value: 50, weight: 5, day_change: null })
    render(<Movers holdings={[...HOLDINGS, noClose]} currency="EUR" />)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.queryByText('NEW')).not.toBeInTheDocument()
    expect(screen.queryByText('+€0')).not.toBeInTheDocument()
  })

  it('shows a dash instead of 0.00% when the daily percentage is unknown', () => {
    const noPct = holding({
      ticker: 'NEW',
      value: 50,
      weight: 5,
      day_change: 5,
      day_change_percent: null,
    })
    render(<Movers holdings={[noPct]} currency="EUR" />)
    const row = screen.getByRole('listitem')
    expect(within(row).getByText('—')).toBeInTheDocument()
    expect(within(row).queryByText(/0\.00%/)).not.toBeInTheDocument()
  })

  it('renders nothing when no holding has a daily change', () => {
    const noClose = holding({ ticker: 'NEW', value: 50, weight: 5, day_change: null })
    const { container } = render(<Movers holdings={[noClose]} currency="EUR" />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('PortfolioSummary', () => {
  it('pluralizes the holdings count', () => {
    const s = {
      holdings_count: 1,
      priced_count: 1,
      total_value: 100,
      total_cost: 80,
      total_return: 20,
      total_return_percent: 25,
      day_change: 1,
      day_change_percent: 1,
      as_of: null,
      delayed_count: 0,
    }
    const { rerender } = render(<PortfolioSummary s={s} currency="EUR" />)
    expect(screen.getByText('1 holding')).toBeInTheDocument()
    rerender(<PortfolioSummary s={{ ...s, holdings_count: 3 }} currency="EUR" />)
    expect(screen.getByText('3 holdings')).toBeInTheDocument()
  })
})

describe('PerformanceChart', () => {
  // sampleSeries() ends on a fixed UTC date, so expected values are deterministic.
  const series = sampleSeries()
  function point(range: RangeKey, i: number) {
    const sl = series.slice(-RANGES[range])
    const rebase = (v: number, v0: number) => ((1 + v / 100) / (1 + v0 / 100) - 1) * 100
    const x = sl[i < 0 ? sl.length + i : i]
    return { p: rebase(x.p, sl[0].p), b: rebase(x.b, sl[0].b), d: x.d, n: sl.length }
  }
  const fmtD = (d: Date) =>
    d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
      timeZone: 'UTC',
    })
  const legend = (name: string) => screen.getByText(name).querySelector('b')!.textContent
  const plot = () => screen.getByRole('img', { name: /Portfolio performance/ }).parentElement!

  function hoverAt(fraction: number) {
    const el = plot()
    el.getBoundingClientRect = () => ({ left: 0, width: 1000 }) as DOMRect
    fireEvent.mouseMove(el, { clientX: fraction * 1000 })
  }

  it('shows the return over the selected range, 1Y by default', async () => {
    render(<PerformanceChart />)
    expect(legend('Portfolio')).toBe(pct(point('1Y', -1).p, 1))
    expect(legend('S&P 500')).toBe(pct(point('1Y', -1).b, 1))

    await userEvent.click(screen.getByRole('button', { name: '1M' }))
    expect(screen.getByRole('button', { name: '1M' })).toHaveAttribute('aria-pressed', 'true')
    expect(legend('Portfolio')).toBe(pct(point('1M', -1).p, 1))
    expect(legend('S&P 500')).toBe(pct(point('1M', -1).b, 1))
    expect(pct(point('1M', -1).p, 1)).not.toBe(pct(point('1Y', -1).p, 1))
  })

  it('shows the hovered point and its date, then restores on mouse leave', () => {
    render(<PerformanceChart />)
    const label = screen.getByText(/vs benchmark$/)
    const mid = point('1Y', Math.round(0.5 * (RANGES['1Y'] - 1)))

    hoverAt(0.5)
    expect(legend('Portfolio')).toBe(pct(mid.p, 1))
    expect(legend('S&P 500')).toBe(pct(mid.b, 1))
    expect(label).toHaveTextContent(fmtD(mid.d))

    hoverAt(0)
    expect(legend('Portfolio')).toBe('+0.0%')
    expect(label).toHaveTextContent(fmtD(point('1Y', 0).d))

    fireEvent.mouseLeave(plot())
    expect(legend('Portfolio')).toBe(pct(point('1Y', -1).p, 1))
    expect(label).toHaveTextContent(/vs benchmark$/)
  })

  it('does not crash when the range shrinks while hovering', () => {
    render(<PerformanceChart />)
    hoverAt(1) // last index of 1Y, past the end of 1M
    fireEvent.click(screen.getByRole('button', { name: '1M' }))
    expect(legend('Portfolio')).toBe(pct(point('1M', -1).p, 1))
    expect(screen.getByText(/vs benchmark$/)).toBeInTheDocument()
  })
})
