import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PortfolioHolding } from '@/lib/api/portfolio'
import { Allocation, Movers, pricedHoldings, Risk } from '../components/sections'

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
    fx_rate: 1,
    value: 0,
    cost_basis: 0,
    day_change: 0,
    total_return: 0,
    total_return_percent: 0,
    weight: 0,
    ...over,
  }
}

// AAPL + NOKIA.HE are Technology, JPM Financial (sampleData tickerMeta). ZZZ is unpriced.
const HOLDINGS = [
  holding({
    ticker: 'NOKIA.HE',
    currency: 'EUR',
    value: 100,
    weight: 10,
    day_change: 10,
    day_change_percent: 1,
  }),
  holding({ ticker: 'AAPL', value: 600, weight: 60, day_change: 200, day_change_percent: 3 }),
  holding({ ticker: 'JPM', value: 300, weight: 30, day_change: -300, day_change_percent: -2 }),
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
    expect(items).toEqual(['Technology70.0%', 'Financial30.0%'])
  })

  it('regroups by country when toggled', async () => {
    render(<Allocation holdings={HOLDINGS} variant="bars" />)
    await userEvent.click(screen.getByRole('button', { name: 'Country' }))
    const items = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(items).toEqual(['United States90.0%', 'Finland10.0%'])
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
})
