import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { PORTFOLIO_QUERY_KEY, type Portfolio } from '@/lib/api/portfolio'
import { usePortfolio } from '../usePortfolio'

function portfolio(total_value: number): Portfolio {
  return {
    base_currency: 'EUR',
    summary: {
      holdings_count: 0,
      priced_count: 0,
      total_value,
      total_cost: 0,
      total_return: 0,
      total_return_percent: 0,
      day_change: 0,
      day_change_percent: 0,
      as_of: null,
      delayed_count: 0,
    },
    holdings: [],
  }
}

const fetchMock = vi.fn()
let client: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('usePortfolio', () => {
  it('serves the server snapshot without fetching', () => {
    const { result } = renderHook(() => usePortfolio(portfolio(100)), { wrapper })
    expect(result.current.data.summary.total_value).toBe(100)
    expect(client.getQueryData(PORTFOLIO_QUERY_KEY)).toEqual(portfolio(100))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refresh refetches in the background without blocking', async () => {
    let resolve!: (r: Response) => void
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)))
    const { result } = renderHook(() => usePortfolio(portfolio(100)), { wrapper })

    let returned: unknown = 'pending'
    act(() => {
      returned = result.current.refresh()
    })
    expect(returned).toBeUndefined() // fire-and-forget, nothing to await
    expect(fetchMock).toHaveBeenCalledWith('/api/me/portfolio', { cache: 'no-store' })
    expect(result.current.data.summary.total_value).toBe(100) // old data while refetching

    resolve(new Response(JSON.stringify(portfolio(250))))
    await waitFor(() => expect(result.current.data.summary.total_value).toBe(250))
  })

  it('sync resolves only once the refetched portfolio is in', async () => {
    let resolve!: (r: Response) => void
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)))
    const { result } = renderHook(() => usePortfolio(portfolio(100)), { wrapper })

    let settled = false
    let pending!: Promise<void>
    act(() => {
      pending = result.current.sync().then(() => {
        settled = true
      })
    })
    await new Promise((r) => setTimeout(r, 10))
    expect(settled).toBe(false) // still waiting on the fetch

    resolve(new Response(JSON.stringify(portfolio(250))))
    await act(() => pending)
    expect(client.getQueryData<Portfolio>(PORTFOLIO_QUERY_KEY)?.summary.total_value).toBe(250)
    // Subscribers re-render a tick after the cache update.
    await waitFor(() => expect(result.current.data.summary.total_value).toBe(250))
  })

  it('sync resolves and keeps the last good data when the refetch fails', async () => {
    fetchMock.mockResolvedValue(new Response('oops', { status: 500 }))
    const { result } = renderHook(() => usePortfolio(portfolio(100)), { wrapper })

    await act(() => result.current.sync())

    expect(result.current.data.summary.total_value).toBe(100)
  })

  it('refetches every 5 minutes to follow the live-quote cache', async () => {
    vi.useFakeTimers()
    try {
      fetchMock.mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify(portfolio(250)))),
      )
      const { result } = renderHook(() => usePortfolio(portfolio(100)), { wrapper })

      await act(() => vi.advanceTimersByTimeAsync(5 * 60 * 1000 - 1000))
      expect(fetchMock).not.toHaveBeenCalled()

      await act(() => vi.advanceTimersByTimeAsync(1000))
      expect(fetchMock).toHaveBeenCalledTimes(1)
      // React Query notifies subscribers via setTimeout, so flush it under fake timers too.
      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(result.current.data.summary.total_value).toBe(250)
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps the last good data when a refresh fails', async () => {
    fetchMock.mockResolvedValue(new Response('oops', { status: 500 }))
    const { result } = renderHook(() => usePortfolio(portfolio(100)), { wrapper })
    act(() => result.current.refresh())
    await waitFor(() => expect(client.getQueryState(PORTFOLIO_QUERY_KEY)?.status).toBe('error'))
    expect(result.current.data.summary.total_value).toBe(100)
  })

  it('starts from the new server snapshot after a remount, not a cached one', async () => {
    // Mirror QueryProvider: long gcTime, no refetch on mount.
    client = new QueryClient({
      defaultOptions: { queries: { gcTime: 30 * 60 * 1000, refetchOnMount: false, retry: false } },
    })
    const first = renderHook(() => usePortfolio(portfolio(100)), { wrapper })
    expect(first.result.current.data.summary.total_value).toBe(100)
    first.unmount()
    await waitFor(() => expect(client.getQueryData(PORTFOLIO_QUERY_KEY)).toBeUndefined())

    const second = renderHook(() => usePortfolio(portfolio(999)), { wrapper })
    expect(second.result.current.data.summary.total_value).toBe(999)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
