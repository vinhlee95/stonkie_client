import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within } from '@/tests/test-utils'
import type { Portfolio, PortfolioHolding } from '@/lib/api/portfolio'
import PortfolioDashboard from '../components/PortfolioDashboard'
import { asOf } from '../format'

const AS_OF = new Date(2026, 8, 25, 18, 30).toISOString()

function holding(over: Partial<PortfolioHolding>): PortfolioHolding {
  return {
    ticker: 'AAPL',
    name: 'Apple Inc',
    shares: 10,
    avg_cost: 100,
    lots: [
      { id: '0b8a3f1e-5d2c-4c3a-9f1e-2b7d8c9a0e11', shares: 10, price: 100, purchased_on: '2025-01-02' },
    ],
    currency: 'USD',
    price: 210,
    day_change_percent: 5,
    trading_date: '2026-09-25',
    as_of: null,
    delayed: false,
    fx_rate: 0.8,
    value: 1680,
    cost_basis: 800,
    day_change: 80,
    total_return: 880,
    total_return_percent: 110,
    weight: 80.77,
    sector: 'Technology',
    country: 'United States',
    asset_type: 'Stock',
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
    as_of: AS_OF,
    delayed_count: 1,
  },
  holdings: [
    holding({ as_of: AS_OF }),
    holding({
      ticker: 'NOKIA.HE',
      name: 'Nokia',
      shares: 100,
      avg_cost: 2,
      lots: [
        { id: '1c9b4a2f-6e3d-4d4b-8a2f-3c8e9d0b1f22', shares: 100, price: 2, purchased_on: null },
      ],
      currency: 'EUR',
      price: 4,
      day_change_percent: -20,
      delayed: true,
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
      screen.getByText(`2 holdings · values in EUR · prices as of ${asOf(AS_OF)} · 1 delayed`),
    ).toBeInTheDocument()
    const table = screen.getByRole('table')
    expect(within(table).getByText('$210.00')).toBeInTheDocument()
    expect(within(table).getByText('€1,680')).toBeInTheDocument()
  })

  it('uses the singular for one holding', () => {
    const one = {
      ...FILLED,
      summary: { ...FILLED.summary, holdings_count: 1 },
      holdings: FILLED.holdings.slice(0, 1),
    }
    render(<PortfolioDashboard initialData={one} />)
    expect(screen.getByText(/^1 holding · values in EUR/)).toBeInTheDocument()
    expect(screen.getByText('1 holding')).toBeInTheDocument() // summary card
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
      if (init?.method === 'POST') return new Response(JSON.stringify({ ticker: 'MSFT' }))
      if (url === '/api/me/portfolio') return new Response(JSON.stringify(FILLED))
      return new Response('[]')
    })
    render(<PortfolioDashboard initialData={EMPTY} />)

    await userEvent.click(await screen.findByRole('button', { name: /MSFT/ }))
    const dialog = screen.getByRole('dialog', { name: 'Add holding' })
    await userEvent.type(within(dialog).getByLabelText('Shares'), '5')
    await userEvent.type(within(dialog).getByLabelText(/Price per share/), '400')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add to portfolio' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!
    expect(post[0]).toBe('/api/me/portfolio/holdings/MSFT/lots')
    expect(JSON.parse(post[1].body)).toEqual({
      shares: 5,
      price: 400,
      purchased_on: null,
      name: 'Microsoft',
    })
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
    await userEvent.type(screen.getByLabelText(/Price per share/), '1')
    await userEvent.click(screen.getByRole('button', { name: 'Add to portfolio' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No price data for NOPE')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('edits a lot from the position view with comma decimals', async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === 'PATCH' ? new Response('{}') : new Response(JSON.stringify(FILLED)),
    )
    render(<PortfolioDashboard initialData={FILLED} />)

    await userEvent.click(
      within(screen.getByRole('table')).getByRole('button', { name: 'Edit AAPL' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Edit AAPL' })
    await userEvent.click(within(dialog).getByRole('button', { name: /^Edit lot/ }))
    const shares = within(dialog).getByLabelText('Shares')
    const save = within(dialog).getByRole('button', { name: 'Save lot' })

    await userEvent.clear(shares)
    await userEvent.type(shares, '1abc')
    expect(save).toBeDisabled()

    await userEvent.clear(shares)
    await userEvent.type(shares, '2,35')
    await userEvent.click(save)

    await waitFor(() => expect(within(dialog).queryByLabelText('Shares')).not.toBeInTheDocument())
    const patch = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH')!
    expect(patch[0]).toBe('/api/me/portfolio/lots/0b8a3f1e-5d2c-4c3a-9f1e-2b7d8c9a0e11')
    expect(JSON.parse(patch[1].body)).toEqual({
      shares: 2.35,
      price: 100,
      purchased_on: '2025-01-02',
    })
    expect(screen.getByRole('dialog', { name: 'Edit AAPL' })).toBeInTheDocument()
  })

  it('hides the raw-symbol fallback until the Yahoo search settles', async () => {
    const searchUrls: string[] = []
    let releaseSearch = () => {}
    const searchGate = new Promise<void>((r) => (releaseSearch = r))
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith('/api/tickers/yahoo')) {
        searchUrls.push(url)
        return searchGate.then(
          () =>
            new Response(
              JSON.stringify([
                { symbol: 'SXR8.DE', name: 'iShares Core S&P 500', exchange: 'XETRA' },
              ]),
            ),
        )
      }
      return Promise.resolve(new Response(JSON.stringify(FILLED)))
    })
    render(<PortfolioDashboard initialData={EMPTY} />)

    await userEvent.click(screen.getByRole('button', { name: /Search ticker or company/ }))
    await userEvent.type(screen.getByLabelText('Search ticker or company'), 'SXR8')
    await screen.findByText('Searching…')
    expect(screen.queryByRole('button', { name: /^SXR8\b/ })).not.toBeInTheDocument()

    await waitFor(() => expect(searchUrls).toHaveLength(1))
    expect(screen.queryByRole('button', { name: /^SXR8\b/ })).not.toBeInTheDocument()
    releaseSearch()
    expect(await screen.findByText('iShares Core S&P 500 · XETRA')).toBeInTheDocument()
    expect(screen.getByText(/Use this Yahoo Finance symbol/)).toBeInTheDocument()
  })

  it('adds a searched ticker using its Yahoo symbol and shows its exchange', async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.startsWith('/api/tickers/yahoo')) {
        return new Response(
          JSON.stringify([{ symbol: 'BRK-B', name: 'Berkshire Hathaway B', exchange: 'NYSE' }]),
        )
      }
      if (init?.method === 'POST') return new Response('{}')
      return new Response(JSON.stringify(FILLED))
    })
    render(<PortfolioDashboard initialData={EMPTY} />)

    await userEvent.click(screen.getByRole('button', { name: /Search ticker or company/ }))
    await userEvent.type(screen.getByLabelText('Search ticker or company'), 'berkshire')
    const row = await screen.findByRole('button', { name: /Berkshire Hathaway B/ })
    expect(within(row).getByText('Berkshire Hathaway B · NYSE')).toBeInTheDocument()
    await userEvent.click(row)
    const dialog = screen.getByRole('dialog', { name: 'Add holding' })
    expect(within(dialog).getByText('BRK-B')).toBeInTheDocument()
    await userEvent.type(within(dialog).getByLabelText('Shares'), '1,000.5')
    await userEvent.type(within(dialog).getByLabelText(/Price per share/), '410')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add to portfolio' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!
    expect(post[0]).toBe('/api/me/portfolio/holdings/BRK-B/lots')
    expect(JSON.parse(post[1].body)).toEqual({
      shares: 1000.5,
      price: 410,
      purchased_on: null,
      name: 'Berkshire Hathaway B',
    })
  })

  it('flags a lot edit whose refresh failed instead of passing old lots off as current', async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') return new Response('{}')
      if (url === '/api/me/portfolio') return new Response('oops', { status: 500 })
      return new Response('[]')
    })
    render(<PortfolioDashboard initialData={FILLED} />)

    await userEvent.click(
      within(screen.getByRole('table')).getByRole('button', { name: 'Edit AAPL' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Edit AAPL' })
    await userEvent.click(within(dialog).getByRole('button', { name: /^Edit lot/ }))
    const shares = within(dialog).getByLabelText('Shares')
    await userEvent.clear(shares)
    await userEvent.type(shares, '3')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save lot' }))

    expect(await within(dialog).findByRole('status')).toHaveTextContent(/couldn't refresh/)
    expect(within(dialog).queryByLabelText('Shares')).not.toBeInTheDocument()
  })

  it('removes a position from the edit dialog', async () => {
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
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove position' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Yes, remove' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith('/api/me/portfolio/holdings/AAPL', { method: 'DELETE' })
  })

  it('deleting the last lot closes the position view', async () => {
    const withoutAapl: Portfolio = {
      ...FILLED,
      summary: { ...FILLED.summary, holdings_count: 1 },
      holdings: [FILLED.holdings[1]],
    }
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === 'DELETE'
        ? new Response(null, { status: 204 })
        : new Response(JSON.stringify(withoutAapl)),
    )
    render(<PortfolioDashboard initialData={FILLED} />)

    await userEvent.click(
      within(screen.getByRole('table')).getByRole('button', { name: 'Edit AAPL' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Edit AAPL' })
    await userEvent.click(within(dialog).getByRole('button', { name: /^Delete lot/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/me/portfolio/lots/0b8a3f1e-5d2c-4c3a-9f1e-2b7d8c9a0e11',
      { method: 'DELETE' },
    )
  })
})
