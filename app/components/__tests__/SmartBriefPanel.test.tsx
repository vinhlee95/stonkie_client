import { render, screen, fireEvent } from '@/tests/test-utils'
import SmartBriefPanel from '../chat/SmartBriefPanel'
import type { BriefData } from '../hooks/useBriefData'
import type { BriefMarketsResult } from '../hooks/useBriefMarkets'
import type { Company } from '@/app/CompanyList'

const briefMarkets: BriefMarketsResult = {
  primary: {
    key: 'USA',
    label: 'US',
    flag: '🇺🇸',
    backendCode: 'US',
    indexLabel: 'S&P 500',
    favouriteCount: 2,
  },
  secondaries: [
    {
      key: 'Finland',
      label: 'Finland',
      flag: '🇫🇮',
      backendCode: 'FI',
      indexLabel: 'OMXH25',
      favouriteCount: 1,
    },
    {
      key: 'Vietnam',
      label: 'Vietnam',
      flag: '🇻🇳',
      backendCode: 'VN',
      indexLabel: 'VN-Index',
      favouriteCount: 0,
    },
  ],
}

const briefData: BriefData = {
  markets: [
    {
      market: briefMarkets.primary,
      recap: {
        id: 1,
        period_start: '2026-05-30',
        period_end: '2026-05-30',
        created_at: '2026-05-30T08:00:00Z',
        summary: 'US markets cautious. Bond yields in focus.',
        bullets: [],
        sources: [],
        questions: ['Why did tech lead?'],
      },
      recapId: '1',
    },
    {
      market: briefMarkets.secondaries[0],
      recap: {
        id: 2,
        period_start: '2026-05-30',
        period_end: '2026-05-30',
        created_at: '2026-05-30T08:00:00Z',
        summary: 'Helsinki rallied on EUR weakness.',
        bullets: [],
        sources: [],
        questions: ['Why is Nokia up?', 'ECB rate outlook?'],
      },
      recapId: '2',
    },
    {
      market: briefMarkets.secondaries[1],
      recap: {
        id: 3,
        period_start: '2026-05-30',
        period_end: '2026-05-30',
        created_at: '2026-05-30T08:00:00Z',
        summary: 'VN-Index pushed past 1,320.',
        bullets: [],
        sources: [],
        questions: [],
      },
      recapId: '3',
    },
  ],
  isLoading: false,
}

const defaultProps = {
  briefData,
  favourites: [],
  briefMarkets,
  onDigIntoRecap: vi.fn(),
  onAskQuestion: vi.fn(),
  onRemoveFavourite: vi.fn(),
}

describe('SmartBriefPanel', () => {
  it('renders PulseCard for primary market', () => {
    render(<SmartBriefPanel {...defaultProps} />)
    expect(screen.getByText(/US Pulse/i)).toBeInTheDocument()
    expect(screen.getByText(/Bond yields in focus/)).toBeInTheDocument()
  })

  it('renders "Also today" section label', () => {
    render(<SmartBriefPanel {...defaultProps} />)
    expect(screen.getByText(/Also today/)).toBeInTheDocument()
  })

  it('renders CollapsedMarketRow for each secondary', () => {
    render(<SmartBriefPanel {...defaultProps} />)
    expect(screen.getByText('Finland')).toBeInTheDocument()
    expect(screen.getByText('Vietnam')).toBeInTheDocument()
  })

  it('only one secondary expanded at a time', () => {
    render(<SmartBriefPanel {...defaultProps} />)
    // Click Finland to expand (use exact aria-label from CollapsedMarketRow)
    fireEvent.click(screen.getByRole('button', { name: 'Finland' }))
    expect(screen.getByText('Dig into pulse')).toBeInTheDocument()

    // Click Vietnam — Finland should collapse
    fireEvent.click(screen.getByRole('button', { name: 'Vietnam' }))
    // "Dig into pulse" should still be visible (for Vietnam now)
    expect(screen.getAllByText('Dig into pulse')).toHaveLength(1)
  })

  it('calls onDigIntoRecap when primary PulseCard is clicked', () => {
    const onDigIntoRecap = vi.fn()
    render(<SmartBriefPanel {...defaultProps} onDigIntoRecap={onDigIntoRecap} />)
    // PulseCard is a button
    const pulseButton = screen.getByText(/US Pulse/i).closest('button')!
    fireEvent.click(pulseButton)
    expect(onDigIntoRecap).toHaveBeenCalledWith('1', 'USA')
  })

  it('hides the watchlist section when there are no favourites', () => {
    render(<SmartBriefPanel {...defaultProps} favourites={[]} />)
    expect(screen.queryByText(/On your watchlist/i)).not.toBeInTheDocument()
  })

  it('renders watchlist rows sorted primary-market-first', () => {
    const favourites: Company[] = [
      {
        name: 'Nokia',
        ticker: 'NOKIA.HE',
        logo_url: '',
        sector: 'Tech',
        country: 'Finland',
        exchange: 'OMX',
      },
      {
        name: 'NVIDIA',
        ticker: 'NVDA',
        logo_url: '',
        sector: 'Tech',
        country: 'USA',
        exchange: 'NASDAQ',
      },
    ]
    render(<SmartBriefPanel {...defaultProps} favourites={favourites} />)

    expect(screen.getByText(/On your watchlist/i)).toBeInTheDocument()
    const tickers = screen.getAllByText(/NVDA|NOKIA\.HE/).map((el) => el.textContent)
    // USA is primary → NVDA before NOKIA.HE despite insertion order
    expect(tickers).toEqual(['NVDA', 'NOKIA.HE'])
  })

  it('shows the precomputed recap summary under a favourite that has one', async () => {
    const favourites: Company[] = [
      {
        name: 'NVIDIA',
        ticker: 'NVDA',
        logo_url: '',
        sector: 'Tech',
        country: 'USA',
        exchange: 'NASDAQ',
      },
      {
        name: 'Nokia',
        ticker: 'NOKIA.HE',
        logo_url: '',
        sector: 'Tech',
        country: 'Finland',
        exchange: 'OMX',
      },
    ]
    // Recap exists for NVDA only; NOKIA.HE proxy returns null (no precomputed row).
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/api/companies/NVDA/recaps')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 1,
            period_start: '2026-06-27',
            period_end: '2026-06-27',
            created_at: '2026-06-28T08:00:00Z',
            summary: 'NVDA rose on strong datacenter demand.',
            bullets: [],
            sources: [],
            price_change: null,
          }),
        })
      }
      // companies/.../recaps for others → null; quotes → empty
      if (url.includes('/recaps')) {
        return Promise.resolve({ ok: true, json: async () => null })
      }
      return Promise.resolve({ ok: true, json: async () => ({ quotes: {} }) })
    })
    vi.stubGlobal('fetch', fetchMock)

    try {
      render(<SmartBriefPanel {...defaultProps} favourites={favourites} />)

      expect(await screen.findByText('NVDA rose on strong datacenter demand.')).toBeInTheDocument()
      // No summary leaks onto the favourite without a recap
      expect(screen.getByText('NOKIA.HE')).toBeInTheDocument()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('shows daily price change badges on watchlist rows when quotes resolve', async () => {
    const favourites: Company[] = [
      {
        name: 'NVIDIA',
        ticker: 'NVDA',
        logo_url: '',
        sector: 'Tech',
        country: 'USA',
        exchange: 'NASDAQ',
      },
      {
        name: 'Nokia',
        ticker: 'NOKIA.HE',
        logo_url: '',
        sector: 'Tech',
        country: 'Finland',
        exchange: 'OMX',
      },
    ]
    // NOKIA.HE intentionally omitted — failed tickers are missing from the response
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        quotes: {
          NVDA: {
            trading_date: '2026-06-10',
            close: 291.58,
            prev_close: 290.55,
            change: 1.03,
            change_percent: 0.35,
            currency: 'USD',
          },
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    try {
      render(<SmartBriefPanel {...defaultProps} favourites={favourites} />)

      expect(await screen.findByText('+0.35% (1.03)')).toBeInTheDocument()
      // One batch call for the whole list, sorted for a stable cache key
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/quotes/price-changes?tickers=${encodeURIComponent('NOKIA.HE,NVDA')}`,
      )
      // Missing ticker renders its row without a badge
      expect(screen.getByText('NOKIA.HE')).toBeInTheDocument()
      expect(screen.getAllByText(/% \(/)).toHaveLength(1)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
