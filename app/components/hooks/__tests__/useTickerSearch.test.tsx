import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useTickerSearch } from '../useTickerSearch'

const fetchMock = vi.fn()

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useTickerSearch', () => {
  it('stays idle for a blank query', () => {
    const { result } = renderHook(() => useTickerSearch('  '), { wrapper })
    expect(result.current).toEqual({ results: [], isLoading: false })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('debounces, then returns results for the settled query', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([{ symbol: 'AAPL', name: 'Apple' }])))
    const { result, rerender } = renderHook(({ q }) => useTickerSearch(q, 300), {
      wrapper,
      initialProps: { q: '' },
    })
    rerender({ q: 'a' })
    rerender({ q: 'ap' })
    rerender({ q: 'apple' })

    expect(result.current.isLoading).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    await waitFor(() => expect(result.current.results).toEqual([{ symbol: 'AAPL', name: 'Apple' }]))
    expect(result.current.isLoading).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/tickers?q=apple')
  })

  it('hides stale results while a new query is debouncing', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([{ symbol: 'AAPL', name: 'Apple' }])))
    const { result, rerender } = renderHook(({ q }) => useTickerSearch(q, 300), {
      wrapper,
      initialProps: { q: 'apple' },
    })
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    await waitFor(() => expect(result.current.results).toHaveLength(1))

    rerender({ q: 'tesla' })
    expect(result.current).toEqual({ results: [], isLoading: true })
  })

  it('returns no results when the search fails', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 502 }))
    const { result } = renderHook(() => useTickerSearch('apple', 300), { wrapper })
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.results).toEqual([])
  })
})
