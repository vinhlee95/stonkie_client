import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import MarketRecapIsland from '../MarketRecapIsland'

describe('MarketRecapIsland', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
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

  it('renders nothing when API returns error', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response('', { status: 500 }))

    render(<MarketRecapIsland marketKey="Finland" />)

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled()
    })

    expect(screen.queryByRole('region', { name: /market recap/i })).not.toBeInTheDocument()
  })

  it('renders nothing when both cadences are null', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ daily: null, weekly: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    render(<MarketRecapIsland marketKey="Vietnam" />)

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled()
    })

    expect(screen.queryByRole('region', { name: /market recap/i })).not.toBeInTheDocument()
  })
})
