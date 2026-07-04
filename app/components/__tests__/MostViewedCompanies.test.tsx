import { fireEvent, render, screen, waitFor, within } from '@/tests/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import MostViewedCompanies, {
  groupCompaniesBySector,
  normalizeSectorKey,
} from '../MostViewedCompanies'
import { Company } from '@/app/CompanyList'

function tickerLinks() {
  return screen
    .getAllByRole('link')
    .filter((el) => el.getAttribute('href')?.startsWith('/tickers/'))
}

function uniqueTickerHrefs() {
  return new Set(
    tickerLinks()
      .map((el) => el.getAttribute('href'))
      .filter(Boolean) as string[],
  )
}

describe('MostViewedCompanies sector grouping', () => {
  it('normalizes sector key case-insensitively', () => {
    expect(normalizeSectorKey('Technology')).toBe('technology')
    expect(normalizeSectorKey('TECHNOLOGY')).toBe('technology')
    expect(normalizeSectorKey('  Health Care  ')).toBe('health care')
  })

  it('merges companies with same sector under different casing', () => {
    const companies: Company[] = [
      {
        name: 'A',
        ticker: 'AAA',
        logo_url: '',
        country: '',
        exchange: '',
        sector: 'Technology',
      },
      {
        name: 'B',
        ticker: 'BBB',
        logo_url: '',
        country: '',
        exchange: '',
        sector: 'TECHNOLOGY',
      },
    ]
    const groups = groupCompaniesBySector(companies)
    expect(groups).toHaveLength(1)
    expect(groups[0].key).toBe('technology')
    expect(groups[0].label).toBe('Technology')
    expect(groups[0].companies).toHaveLength(2)
  })

  it('orders sectors by ticker count descending', () => {
    const companies: Company[] = [
      { name: 'F', ticker: 'F1', logo_url: '', country: '', exchange: '', sector: 'Financials' },
      { name: 'T1', ticker: 'T1', logo_url: '', country: '', exchange: '', sector: 'Technology' },
      { name: 'T2', ticker: 'T2', logo_url: '', country: '', exchange: '', sector: 'Technology' },
      { name: 'T3', ticker: 'T3', logo_url: '', country: '', exchange: '', sector: 'Technology' },
    ]
    const groups = groupCompaniesBySector(companies)
    expect(groups.map((g) => g.key)).toEqual(['technology', 'financials'])
  })

  it('renders one section per sector with all companies visible', () => {
    const companies: Company[] = [
      { name: 'A', ticker: 'AAA', logo_url: '', country: '', exchange: '', sector: 'Technology' },
      { name: 'B', ticker: 'BBB', logo_url: '', country: '', exchange: '', sector: 'Financials' },
      { name: 'C', ticker: 'CCC', logo_url: '', country: '', exchange: '', sector: 'Technology' },
    ]
    render(<MostViewedCompanies companies={companies} />)

    expect(screen.getByRole('heading', { name: 'Technology' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Financials' })).toBeInTheDocument()
    expect(uniqueTickerHrefs()).toEqual(new Set(['/tickers/AAA', '/tickers/BBB', '/tickers/CCC']))
  })
})

describe('MostViewedCompanies market filter', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const u = String(input)
      if (u.includes('/api/markets/') && u.includes('/recaps')) {
        return new Response(JSON.stringify({ daily: null, weekly: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response('', { status: 404 })
    })
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  const companies: Company[] = [
    {
      name: 'Apple',
      ticker: 'AAPL',
      logo_url: '',
      sector: 'Technology',
      country: 'USA',
      exchange: 'NASDAQ',
    },
    {
      name: 'Nokia',
      ticker: 'NOKIA',
      logo_url: '',
      sector: 'Technology',
      country: 'Finland',
      exchange: 'OMX',
    },
    {
      name: 'Vinamilk',
      ticker: 'VNM',
      logo_url: '',
      sector: 'Consumer',
      country: 'Vietnam',
      exchange: 'HOSE',
    },
    {
      name: 'Google',
      ticker: 'GOOG',
      logo_url: '',
      sector: 'Technology',
      country: 'USA',
      exchange: 'NASDAQ',
    },
  ]
  it('filters the list by selected market', () => {
    render(<MostViewedCompanies companies={companies} />)

    const tablist = screen.getByRole('tablist', { name: /market filter/i })
    fireEvent.click(within(tablist).getByRole('tab', { name: /US/i }))

    const hrefs = new Set(
      tickerLinks()
        .map((l) => l.getAttribute('href'))
        .filter(Boolean) as string[],
    )
    expect(hrefs).toContain('/tickers/AAPL')
    expect(hrefs).toContain('/tickers/GOOG')
    expect(hrefs).not.toContain('/tickers/NOKIA')
    expect(hrefs).not.toContain('/tickers/VNM')
  })

  it('shows the selected market chart when market is selected', () => {
    const { container } = render(<MostViewedCompanies companies={companies} />)
    const tablist = screen.getByRole('tablist', { name: /market filter/i })
    fireEvent.click(within(tablist).getByRole('tab', { name: /Finland/i }))
    expect(container.querySelector('.tradingview-widget-container')).not.toBeNull()
  })

  it('hides market tabs with zero tickers', () => {
    const usOnly: Company[] = [
      {
        name: 'Apple',
        ticker: 'AAPL',
        logo_url: '',
        sector: 'Technology',
        country: 'USA',
        exchange: 'NASDAQ',
      },
    ]
    render(<MostViewedCompanies companies={usOnly} />)
    const tablist = screen.getByRole('tablist', { name: /market filter/i })
    expect(within(tablist).queryByRole('tab', { name: /Finland/i })).not.toBeInTheDocument()
    expect(within(tablist).queryByRole('tab', { name: /Vietnam/i })).not.toBeInTheDocument()
    expect(within(tablist).getByRole('tab', { name: /US/i })).toBeInTheDocument()
  })

  it('shows recap only for country tabs with recap data', async () => {
    const weeklyUs = {
      period_start: '2026-04-20',
      period_end: '2026-04-24',
      created_at: '2026-04-25T13:18:03.721444Z',
      summary: 'US weekly market recap',
      bullets: [{ text: 'US bullet', citations: [] }],
      sources: [],
    }
    vi.mocked(globalThis.fetch).mockImplementation(async (input: RequestInfo | URL) => {
      const u = String(input)
      if (u.includes('/api/markets/US/recaps')) {
        return new Response(JSON.stringify({ daily: null, weekly: weeklyUs }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      if (u.includes('/api/markets/') && u.includes('/recaps')) {
        return new Response(JSON.stringify({ daily: null, weekly: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response('', { status: 404 })
    })

    render(<MostViewedCompanies companies={companies} />)

    expect(screen.queryByText(/US weekly market recap/i)).not.toBeInTheDocument()

    const tablist = screen.getByRole('tablist', { name: /market filter/i })
    fireEvent.click(within(tablist).getByRole('tab', { name: /US/i }))

    await waitFor(() => {
      expect(screen.getByText(/US weekly market recap/i)).toBeInTheDocument()
    })
  })

  it('renders vietnam recap without requiring a chart', async () => {
    const weeklyVn = {
      period_start: '2026-04-20',
      period_end: '2026-04-24',
      created_at: '2026-04-25T13:18:03.721444Z',
      summary: 'Vietnam weekly market recap',
      bullets: [{ text: 'VN bullet', citations: [] }],
      sources: [],
    }
    vi.mocked(globalThis.fetch).mockImplementation(async (input: RequestInfo | URL) => {
      const u = String(input)
      if (u.includes('/api/markets/VN/recaps')) {
        return new Response(JSON.stringify({ daily: null, weekly: weeklyVn }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      if (u.includes('/api/markets/') && u.includes('/recaps')) {
        return new Response(JSON.stringify({ daily: null, weekly: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response('', { status: 404 })
    })

    render(<MostViewedCompanies companies={companies} />)

    const tablist = screen.getByRole('tablist', { name: /market filter/i })
    fireEvent.click(within(tablist).getByRole('tab', { name: /Vietnam/i }))

    await waitFor(() => {
      expect(screen.getByText(/Vietnam weekly market recap/i)).toBeInTheDocument()
    })
  })
})
