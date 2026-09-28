import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PortfolioHolding } from '@/lib/api/portfolio'
import { HoldingsList, HoldingsTable, sortRows } from '../components/holdings'

function holding(over: Partial<PortfolioHolding>): PortfolioHolding {
  return {
    ticker: 'AAPL',
    name: null,
    shares: 2,
    avg_cost: 100,
    currency: 'USD',
    price: 200,
    day_change_percent: 1,
    trading_date: '2026-09-25',
    as_of: null,
    delayed: false,
    fx_rate: 1,
    value: 400,
    cost_basis: 200,
    day_change: 4,
    total_return: 200,
    total_return_percent: 100,
    weight: 40,
    sector: 'Technology',
    country: 'United States',
    asset_type: 'Stock',
    ...over,
  }
}

const UNPRICED = holding({
  ticker: 'ZZZ',
  price: null,
  day_change_percent: null,
  value: null,
  day_change: null,
  total_return: null,
  total_return_percent: null,
  weight: null,
})
const ROWS = [
  holding({ ticker: 'MSFT', value: 100, weight: 10 }),
  UNPRICED,
  holding({ ticker: 'AAPL', value: 600, weight: 60 }),
  holding({ ticker: 'BRK-B', value: 300, weight: 30 }),
]
const tickers = (rows: PortfolioHolding[]) => rows.map((h) => h.ticker)

describe('sortRows', () => {
  it('sorts numbers both ways with unpriced (null) values last', () => {
    expect(tickers(sortRows(ROWS, 'value', -1))).toEqual(['AAPL', 'BRK-B', 'MSFT', 'ZZZ'])
    expect(tickers(sortRows(ROWS, 'value', 1))).toEqual(['MSFT', 'BRK-B', 'AAPL', 'ZZZ'])
    expect(tickers(sortRows(ROWS, 'weight', 1))).toEqual(['MSFT', 'BRK-B', 'AAPL', 'ZZZ'])
  })

  it('keeps several null values together at the end', () => {
    const rows = [UNPRICED, holding({ ticker: 'A', value: 1 }), { ...UNPRICED, ticker: 'Y' }]
    expect(
      tickers(sortRows(rows, 'value', -1))
        .slice(-2)
        .sort(),
    ).toEqual(['Y', 'ZZZ'])
    expect(tickers(sortRows(rows, 'value', 1))[0]).toBe('A')
  })

  it('sorts the ticker column alphabetically', () => {
    expect(tickers(sortRows(ROWS, 'ticker', 1))).toEqual(['AAPL', 'BRK-B', 'MSFT', 'ZZZ'])
    expect(tickers(sortRows(ROWS, 'ticker', -1))).toEqual(['ZZZ', 'MSFT', 'BRK-B', 'AAPL'])
  })

  it('does not mutate the input', () => {
    const copy = [...ROWS]
    sortRows(ROWS, 'value', -1)
    expect(ROWS).toEqual(copy)
  })
})

describe('HoldingsList', () => {
  it('lists holdings by value, largest first, unpriced last', () => {
    render(<HoldingsList holdings={ROWS} currency="EUR" onEdit={() => {}} />)
    const labels = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))
    expect(labels).toEqual(['Edit AAPL', 'Edit BRK-B', 'Edit MSFT', 'Edit ZZZ'])
    expect(screen.getByText('4 · by value')).toBeInTheDocument()
  })

  it('shows a dash for an unpriced holding', () => {
    render(<HoldingsList holdings={ROWS} currency="EUR" onEdit={() => {}} />)
    const row = screen.getByRole('button', { name: 'Edit ZZZ' })
    expect(within(row).getByText('2 × —')).toBeInTheDocument() // price
    expect(within(row).getByText('—')).toBeInTheDocument() // value
    const priced = screen.getByRole('button', { name: 'Edit AAPL' })
    expect(within(priced).getByText('€600')).toBeInTheDocument()
    expect(within(priced).queryByText('—')).not.toBeInTheDocument()
  })

  it('calls onEdit with the tapped holding', async () => {
    const onEdit = vi.fn()
    render(<HoldingsList holdings={ROWS} currency="EUR" onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: 'Edit BRK-B' }))
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledWith(ROWS[3])
  })
})

describe('delayed rows', () => {
  it('tags holdings priced at the last close instead of a live quote', () => {
    render(
      <HoldingsList
        holdings={[holding({ ticker: 'LIVE' }), holding({ ticker: 'SLOW', delayed: true })]}
        currency="EUR"
        onEdit={vi.fn()}
      />,
    )

    const tags = screen.getAllByText('delayed')
    expect(tags).toHaveLength(1)
    expect(tags[0]).toHaveAttribute('title', 'Live price unavailable — showing last close')
    expect(tags[0].closest('li')).toHaveTextContent('SLOW')
  })

  it('tags only the delayed row in the desktop table', () => {
    render(
      <HoldingsTable
        holdings={[holding({ ticker: 'LIVE' }), holding({ ticker: 'SLOW', delayed: true })]}
        currency="EUR"
        onEdit={vi.fn()}
      />,
    )

    const table = screen.getByRole('table')
    const tags = within(table).getAllByText('delayed')
    expect(tags).toHaveLength(1)
    expect(tags[0].closest('tr')).toHaveTextContent('SLOW')
  })
})
