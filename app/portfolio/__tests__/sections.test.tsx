import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import type { PerformancePoint, PortfolioHolding } from '@/lib/api/portfolio'
import { pct } from '../format'
import { sliceAndRebase, type RangeKey } from '../performance'
import {
  Allocation,
  Movers,
  PerformanceChart,
  PortfolioSummary,
  pricedHoldings,
  type PerformanceState,
  Risk,
} from '../components/sections'

function holding(over: Partial<PortfolioHolding>): PortfolioHolding {
  return {
    ticker: 'AAPL',
    name: null,
    shares: 1,
    avg_cost: 1,
    lots: [],
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

/** Weekdays from 2025-09-01 to 2026-10-02, values drifting so every range differs. */
function makePoints(): PerformancePoint[] {
  const out: PerformancePoint[] = []
  for (let t = Date.UTC(2025, 8, 1), i = 0; t <= Date.UTC(2026, 9, 2); t += 864e5) {
    const day = new Date(t).getUTCDay()
    if (day === 0 || day === 6) continue
    out.push({
      date: new Date(t).toISOString().slice(0, 10),
      portfolio_value: 10000 + i * 20 + (i % 7) * 15,
      benchmark_value: 5000 + i * 4 - (i % 5) * 9,
    })
    i++
  }
  return out
}
const POINTS = makePoints()
const LOADED: PerformanceState = { points: POINTS, status: 'success' }

const SUMMARY = {
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

describe('PortfolioSummary', () => {
  const summary = (range: RangeKey, performance: PerformanceState = LOADED) =>
    render(<PortfolioSummary s={SUMMARY} currency="EUR" range={range} performance={performance} />)
  const returnBox = () => screen.getByText('Return').parentElement!

  it('pluralizes the holdings count', () => {
    const { rerender } = summary('All')
    expect(screen.getByText('1 holding')).toBeInTheDocument()
    rerender(
      <PortfolioSummary
        s={{ ...SUMMARY, holdings_count: 3 }}
        currency="EUR"
        range="All"
        performance={LOADED}
      />,
    )
    expect(screen.getByText('3 holdings')).toBeInTheDocument()
  })

  it('All shows the cost-basis return', () => {
    summary('All', { points: undefined, status: 'pending' })
    expect(within(returnBox()).getByText('+€20')).toBeInTheDocument()
    expect(within(returnBox()).getByText('+25.00%')).toBeInTheDocument()
  })

  it('other ranges show the back-tested change over the range', () => {
    summary('YTD')
    // YTD is based on the last close of 2025.
    const start = POINTS.filter((p) => p.date <= '2025-12-31').at(-1)!.portfolio_value
    const end = POINTS.at(-1)!.portfolio_value
    const box = returnBox()
    expect(
      within(box).getByText(`+€${Math.round(end - start).toLocaleString('en-US')}`),
    ).toBeInTheDocument()
    expect(within(box).getByText(pct((end / start - 1) * 100))).toBeInTheDocument()
    expect(box).toHaveAttribute('title', expect.stringMatching(/current holdings/))
    expect(screen.queryByText('Total return')).not.toBeInTheDocument()
  })

  it('shows a placeholder while loading and a dash on error', () => {
    const { unmount } = summary('1M', { points: undefined, status: 'pending' })
    expect(screen.getByLabelText('Loading return')).toBeInTheDocument()
    unmount()
    summary('1M', { points: undefined, status: 'error' })
    expect(within(returnBox()).getByText('—')).toBeInTheDocument()
  })
})

describe('PerformanceChart', () => {
  const fmtD = (d: Date) =>
    d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
      timeZone: 'UTC',
    })
  const legend = (name: string) => screen.getByText(name).querySelector('b')!.textContent
  const plot = () => screen.getByRole('img', { name: /Portfolio performance/ }).parentElement!

  function Controlled({
    initial = '1Y',
    performance = LOADED,
  }: {
    initial?: RangeKey
    performance?: PerformanceState
  }) {
    const [range, setRange] = useState<RangeKey>(initial)
    return <PerformanceChart range={range} onRangeChange={setRange} performance={performance} />
  }

  function hoverAt(fraction: number) {
    const el = plot()
    el.getBoundingClientRect = () => ({ left: 0, width: 1000 }) as DOMRect
    fireEvent.mouseMove(el, { clientX: fraction * 1000 })
  }

  it('shows the return over the selected range and switches without refetching', async () => {
    render(<Controlled initial="1Y" />)
    const oneYear = sliceAndRebase(POINTS, '1Y')
    expect(legend('Portfolio')).toBe(pct(oneYear.at(-1)!.p, 1))
    expect(legend('S&P 500')).toBe(pct(oneYear.at(-1)!.b, 1))

    await userEvent.click(screen.getByRole('button', { name: '1M' }))
    const oneMonth = sliceAndRebase(POINTS, '1M')
    expect(screen.getByRole('button', { name: '1M' })).toHaveAttribute('aria-pressed', 'true')
    expect(legend('Portfolio')).toBe(pct(oneMonth.at(-1)!.p, 1))
    expect(legend('S&P 500')).toBe(pct(oneMonth.at(-1)!.b, 1))
    expect(legend('Portfolio')).not.toBe(pct(oneYear.at(-1)!.p, 1))
  })

  it('shows the hovered point and its date, then restores on mouse leave', () => {
    render(<Controlled initial="1Y" />)
    const data = sliceAndRebase(POINTS, '1Y')
    const label = screen.getByText(/vs benchmark$/)
    const mid = data[Math.round(0.5 * (data.length - 1))]

    hoverAt(0.5)
    expect(legend('Portfolio')).toBe(pct(mid.p, 1))
    expect(legend('S&P 500')).toBe(pct(mid.b, 1))
    expect(label).toHaveTextContent(fmtD(mid.d))

    hoverAt(0)
    expect(legend('Portfolio')).toBe('+0.0%')
    expect(label).toHaveTextContent(fmtD(data[0].d))

    fireEvent.mouseLeave(plot())
    expect(legend('Portfolio')).toBe(pct(data.at(-1)!.p, 1))
    expect(label).toHaveTextContent(/vs benchmark$/)
  })

  it('does not crash when the range shrinks while hovering', () => {
    render(<Controlled initial="1Y" />)
    hoverAt(1) // last index of 1Y, past the end of 1M
    fireEvent.click(screen.getByRole('button', { name: '1M' }))
    expect(legend('Portfolio')).toBe(pct(sliceAndRebase(POINTS, '1M').at(-1)!.p, 1))
    expect(screen.getByText(/vs benchmark$/)).toBeInTheDocument()
  })

  it('labels the series as a back-test, not sample data', () => {
    render(<Controlled />)
    expect(screen.getByText('Based on current holdings')).toBeInTheDocument()
    expect(screen.queryByText('Sample data')).not.toBeInTheDocument()
  })

  it('shows loading, error and empty states', () => {
    const { rerender } = render(
      <Controlled performance={{ points: undefined, status: 'pending' }} />,
    )
    expect(screen.getByLabelText('Loading performance')).toBeInTheDocument()
    expect(legend('Portfolio')).toBe('—')

    rerender(<Controlled performance={{ points: undefined, status: 'error' }} />)
    expect(screen.getByText("Couldn't load performance history.")).toBeInTheDocument()

    rerender(<Controlled performance={{ points: [], status: 'success' }} />)
    expect(screen.getByText(/No price history/)).toBeInTheDocument()
  })

  it('says when a range has too little history', () => {
    render(
      <Controlled initial="1M" performance={{ points: POINTS.slice(-1), status: 'success' }} />,
    )
    expect(screen.getByText('Not enough history for this range yet.')).toBeInTheDocument()
  })
})
