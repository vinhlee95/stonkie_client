import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within } from '@/tests/test-utils'
import type { Portfolio, PortfolioHolding } from '@/lib/api/portfolio'
import PortfolioDashboard from '../components/PortfolioDashboard'

function holding(over: Partial<PortfolioHolding>): PortfolioHolding {
  return {
    ticker: 'AAPL',
    name: 'Apple Inc',
    shares: 10,
    avg_cost: 100,
    currency: 'USD',
    price: 210,
    day_change_percent: 5,
    trading_date: '2026-09-25',
    fx_rate: 0.8,
    value: 1680,
    cost_basis: 800,
    day_change: 80,
    total_return: 880,
    total_return_percent: 110,
    weight: 80.77,
    ...over,
  }
}

const FILLED: Portfolio = {
  base_currency: 'EUR',
  summary: {
    holdings_count: 2,
    priced_count: 2,
    total_value: 2080,
    total_cost: 1000,
    total_return: 1080,
    total_return_percent: 108,
    day_change: -20,
    day_change_percent: -0.95,
    as_of: '2026-09-25',
  },
  holdings: [
    holding({}),
    holding({
      ticker: 'NOKIA.HE',
      name: 'Nokia',
      shares: 100,
      avg_cost: 2,
      currency: 'EUR',
      price: 4,
      day_change_percent: -20,
      fx_rate: 1,
      value: 400,
      cost_basis: 200,
      day_change: -100,
      total_return: 200,
      total_return_percent: 100,
      weight: 19.23,
    }),
  ],
}

const EMPTY: Portfolio = {
  ...FILLED,
  summary: { ...FILLED.summary, holdings_count: 0, priced_count: 0, total_value: 0, as_of: null },
  holdings: [],
}

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.mocked(localStorage.getItem).mockReturnValue(null)
})
afterEach(() => vi.unstubAllGlobals())

describe('PortfolioDashboard', () => {
  it('renders totals and holdings in EUR', () => {
    render(<PortfolioDashboard initialData={FILLED} />)

    expect(screen.getByText('€2,080.00')).toBeInTheDocument()
    expect(screen.getByText(/−€20.00 \(−0.95%\)/)).toBeInTheDocument()
    expect(
      screen.getByText(/2 holdings · values in EUR · prices as of 2026-09-25/),
    ).toBeInTheDocument()
    const table = screen.getByRole('table')
    expect(within(table).getByText('$210.00')).toBeInTheDocument()
    expect(within(table).getByText('€1,680')).toBeInTheDocument()
  })

  it('sorts holdings table by column', async () => {
    render(<PortfolioDashboard initialData={FILLED} />)
    const table = screen.getByRole('table')
    const tickers = () =>
      within(table)
        .getAllByRole('button', { name: /^Edit / })
        .map((b) => b.getAttribute('aria-label'))

    expect(tickers()).toEqual(['Edit AAPL', 'Edit NOKIA.HE'])
    await userEvent.click(within(table).getByRole('button', { name: /Value €/ }))
    expect(tickers()).toEqual(['Edit NOKIA.HE', 'Edit AAPL'])
  })

  it('flags unpriced holdings', () => {
    const data = {
      ...FILLED,
      holdings: [
        ...FILLED.holdings,
        holding({ ticker: 'ZZZ', value: null, weight: null, price: null }),
      ],
    }
    render(<PortfolioDashboard initialData={data} />)
    expect(screen.getByRole('status')).toHaveTextContent('No price for ZZZ')
  })

  it('marks placeholder sections as sample data', () => {
    render(<PortfolioDashboard initialData={FILLED} />)
    expect(screen.getAllByText('Sample data').length).toBeGreaterThan(0)
  })

  it('empty state adds a favourite and refetches', async () => {
    vi.mocked(localStorage.getItem).mockImplementation((key) =>
      key === 'stonkie_favourites' ? JSON.stringify([{ ticker: 'MSFT', name: 'Microsoft' }]) : null,
    )
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') return new Response(JSON.stringify({ ticker: 'MSFT' }))
      if (url === '/api/me/portfolio') return new Response(JSON.stringify(FILLED))
      return new Response('[]')
    })
    render(<PortfolioDashboard initialData={EMPTY} />)

    await userEvent.click(await screen.findByRole('button', { name: /MSFT/ }))
    const dialog = screen.getByRole('dialog', { name: 'Add holding' })
    await userEvent.type(within(dialog).getByLabelText('Shares'), '5')
    await userEvent.type(within(dialog).getByLabelText(/Average cost/), '400')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add to portfolio' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const put = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')!
    expect(put[0]).toBe('/api/me/portfolio/holdings/MSFT')
    expect(JSON.parse(put[1].body)).toEqual({ shares: 5, avg_cost: 400, name: 'Microsoft' })
    expect(await screen.findByText('€2,080.00')).toBeInTheDocument()
  })

  it('shows backend validation error and keeps dialog open', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: 'No price data for NOPE' }), { status: 422 }),
    )
    render(<PortfolioDashboard initialData={EMPTY} />)

    await userEvent.click(screen.getByRole('button', { name: /Search ticker or company/ }))
    await userEvent.type(screen.getByLabelText('Search ticker or company'), 'nope')
    await userEvent.click(await screen.findByRole('button', { name: /^NOPE/ }))
    await userEvent.type(screen.getByLabelText('Shares'), '1')
    await userEvent.type(screen.getByLabelText(/Average cost/), '1')
    await userEvent.click(screen.getByRole('button', { name: 'Add to portfolio' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No price data for NOPE')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('accepts comma decimals and blocks invalid numbers', async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === 'PUT' ? new Response('{}') : new Response(JSON.stringify(FILLED)),
    )
    render(<PortfolioDashboard initialData={FILLED} />)

    await userEvent.click(
      within(screen.getByRole('table')).getByRole('button', { name: 'Edit AAPL' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Edit AAPL' })
    const shares = within(dialog).getByLabelText('Shares')
    const save = within(dialog).getByRole('button', { name: 'Save' })

    await userEvent.clear(shares)
    await userEvent.type(shares, '1abc')
    expect(save).toBeDisabled()
    expect(within(dialog).getByText(/Enter positive numbers/)).toBeInTheDocument()

    await userEvent.clear(shares)
    await userEvent.type(shares, '2,35')
    await userEvent.click(save)

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const put = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')!
    expect(JSON.parse(put[1].body)).toMatchObject({ shares: 2.35, avg_cost: 100 })
  })

  it('removes a holding from the edit dialog', async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === 'DELETE'
        ? new Response(null, { status: 204 })
        : new Response(JSON.stringify(FILLED)),
    )
    render(<PortfolioDashboard initialData={FILLED} />)

    await userEvent.click(
      within(screen.getByRole('table')).getByRole('button', { name: 'Edit AAPL' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Edit AAPL' })
    expect(within(dialog).getByLabelText('Shares')).toHaveValue('10')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith('/api/me/portfolio/holdings/AAPL', { method: 'DELETE' })
  })
})
