import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import MarketRecapIsland from '../MarketRecapIsland'

describe('MarketRecapIsland', () => {
  const originalFetch = globalThis.fetch

  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('shows market recap region with loading state while fetch is pending', async () => {
    let resolveFetch!: (value: Response) => void
    const fetchHold = new Promise<Response>((resolve) => {
      resolveFetch = resolve
    })
    vi.mocked(globalThis.fetch).mockImplementation(() => fetchHold)

    render(<MarketRecapIsland marketKey="USA" />)

    const region = screen.getByRole('region', { name: /market recap/i })
    expect(region).toBeInTheDocument()
    expect(region).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status', { name: /loading market recap/i })).toBeInTheDocument()

    resolveFetch!(
      new Response(
        JSON.stringify({
          daily: null,
          weekly: {
            period_start: '2026-04-20',
            period_end: '2026-04-24',
            created_at: '2026-04-25T13:00:00.000Z',
            summary: 'Deferred weekly recap',
            bullets: [],
            sources: [],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    await waitFor(() => {
      expect(screen.getByText(/Deferred weekly recap/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('status', { name: /loading market recap/i })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: /market recap/i })).not.toHaveAttribute(
      'aria-busy',
      'true',
    )
  })

  it('fetches recap pair and renders MarketRecapCard', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          daily: null,
          weekly: {
            period_start: '2026-04-20',
            period_end: '2026-04-24',
            created_at: '2026-04-25T13:00:00.000Z',
            summary: 'Island weekly recap line',
            bullets: [],
            sources: [],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    render(<MarketRecapIsland marketKey="USA" />)

    await waitFor(() => {
      expect(screen.getByText(/Island weekly recap line/i)).toBeInTheDocument()
    })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/markets/US/recaps',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('aborts in-flight fetch when marketKey changes so only the latest market completes', async () => {
    const weeklyFi = {
      period_start: '2026-04-20',
      period_end: '2026-04-24',
      created_at: '2026-04-25T13:00:00.000Z',
      summary: 'Finland weekly only',
      bullets: [],
      sources: [],
    }

    vi.mocked(globalThis.fetch).mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        const signal = init?.signal
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 20)
        })
        if (signal?.aborted) {
          return Promise.reject(new DOMException('Aborted', 'AbortError'))
        }
        if (url.includes('/api/markets/US/recaps')) {
          return new Response(
            JSON.stringify({
              daily: null,
              weekly: {
                period_start: '2026-04-20',
                period_end: '2026-04-24',
                created_at: '2026-04-25T13:00:00.000Z',
                summary: 'US weekly stale',
                bullets: [],
                sources: [],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (url.includes('/api/markets/FI/recaps')) {
          return new Response(JSON.stringify({ daily: null, weekly: weeklyFi }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response('', { status: 404 })
      },
    )

    const { rerender } = render(<MarketRecapIsland marketKey="USA" />)
    rerender(<MarketRecapIsland marketKey="Finland" />)

    await waitFor(() => {
      expect(screen.getByText(/Finland weekly only/i)).toBeInTheDocument()
    })
    expect(screen.queryByText(/US weekly stale/i)).not.toBeInTheDocument()
  })

  it('shows fetch-failed message and try again when API returns error', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response('', { status: 500 }))

    render(<MarketRecapIsland marketKey="Finland" />)

    await waitFor(() => {
      expect(screen.getByText(/couldn't load the market recap/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('region', { name: /market recap/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('shows no-data message when both cadences are null (week wording by default)', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ daily: null, weekly: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    render(<MarketRecapIsland marketKey="Vietnam" />)

    await waitFor(() => {
      expect(screen.getByText(/No market recap for this week/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('region', { name: /market recap/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('uses day wording for no-data when unavailablePeriod is day', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ daily: null, weekly: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    render(<MarketRecapIsland marketKey="Vietnam" unavailablePeriod="day" />)

    await waitFor(() => {
      expect(screen.getByText(/No market recap for this day/i)).toBeInTheDocument()
    })
  })

  it('refetches when try again is clicked after a fetch failure', async () => {
    const weekly = {
      period_start: '2026-04-20',
      period_end: '2026-04-24',
      created_at: '2026-04-25T13:00:00.000Z',
      summary: 'Retry weekly recap',
      bullets: [],
      sources: [],
    }

    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ daily: null, weekly: weekly }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

    render(<MarketRecapIsland marketKey="USA" />)

    await waitFor(() => {
      expect(screen.getByText(/couldn't load the market recap/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    await waitFor(() => {
      expect(screen.getByText(/Retry weekly recap/i)).toBeInTheDocument()
    })

    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  describe('Dig deeper respects cadence toggle', () => {
    const dailyRecap = {
      id: 10,
      period_start: '2026-04-24',
      period_end: '2026-04-24',
      created_at: '2026-04-25T01:30:00.000000Z',
      summary: 'Daily recap: stocks rose on tech strength',
      bullets: [],
      sources: [],
      questions: ['What drove tech gains today?', 'Will momentum continue tomorrow?'],
    }

    const weeklyRecap = {
      id: 11,
      period_start: '2026-04-20',
      period_end: '2026-04-24',
      created_at: '2026-04-25T13:00:00.000Z',
      summary: 'Weekly recap: S&P 500 gained over the week',
      bullets: [],
      sources: [],
      questions: ['What sectors led the weekly rally?', 'How did bonds react?'],
    }

    function mockBothCadences() {
      vi.mocked(globalThis.fetch).mockResolvedValue(
        new Response(JSON.stringify({ daily: dailyRecap, weekly: weeklyRecap }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }

    it('opens modal with weekly recap when user toggles to Weekly before clicking Dig deeper', async () => {
      mockBothCadences()
      render(<MarketRecapIsland marketKey="USA" />)

      await waitFor(() => {
        expect(screen.getByText(/Daily recap: stocks rose on tech strength/i)).toBeInTheDocument()
      })

      // Toggle to weekly
      fireEvent.click(screen.getByRole('button', { name: /^weekly$/i }))
      expect(screen.getByText(/Weekly recap: S&P 500 gained over the week/i)).toBeInTheDocument()

      // Expand card and click Dig deeper
      const section = screen.getByRole('region', { name: /market recap/i })
      fireEvent.click(within(section).getByRole('button', { name: /market recap/i }))
      fireEvent.click(within(section).getByRole('button', { name: /dig deeper/i }))

      // Modal should show weekly context, not daily
      await waitFor(() => {
        expect(screen.getAllByText(/USA Weekly Recap/i).length).toBeGreaterThanOrEqual(1)
      })
      expect(screen.queryByText(/USA Daily Recap/i)).not.toBeInTheDocument()

      // Weekly questions should render, not daily ones
      await waitFor(() => {
        expect(screen.getByText(/What sectors led the weekly rally/i)).toBeInTheDocument()
      })
      expect(screen.getByText(/How did bonds react/i)).toBeInTheDocument()
      expect(screen.queryByText(/What drove tech gains today/i)).not.toBeInTheDocument()
    })

    it('opens modal with daily recap by default when both cadences exist', async () => {
      mockBothCadences()
      render(<MarketRecapIsland marketKey="USA" />)

      await waitFor(() => {
        expect(screen.getByText(/Daily recap: stocks rose on tech strength/i)).toBeInTheDocument()
      })

      // Expand card and click Dig deeper (daily is default)
      const section = screen.getByRole('region', { name: /market recap/i })
      fireEvent.click(within(section).getByRole('button', { name: /market recap/i }))
      fireEvent.click(within(section).getByRole('button', { name: /dig deeper/i }))

      await waitFor(() => {
        expect(screen.getAllByText(/USA Daily Recap/i).length).toBeGreaterThanOrEqual(1)
      })
      expect(screen.queryByText(/USA Weekly Recap/i)).not.toBeInTheDocument()

      // Daily questions should render
      await waitFor(() => {
        expect(screen.getByText(/What drove tech gains today/i)).toBeInTheDocument()
      })
      expect(screen.getByText(/Will momentum continue tomorrow/i)).toBeInTheDocument()
    })
  })
})
