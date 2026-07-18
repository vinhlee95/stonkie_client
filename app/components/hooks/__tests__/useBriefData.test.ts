import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useBriefData } from '../useBriefData'
import type { BriefMarketsResult } from '../useBriefMarkets'
import type { MarketRecapPair } from '@/lib/api/marketRecap'

const mockBriefMarkets: BriefMarketsResult = {
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

const mockRecapPair: MarketRecapPair = {
  daily: {
    id: 1,
    period_start: '2026-05-30',
    period_end: '2026-05-30',
    created_at: '2026-05-30T08:00:00Z',
    summary: 'US markets rallied on strong earnings.',
    bullets: [],
    sources: [],
    audio: null,
    questions: ['Why did tech lead?', 'How are bonds reacting?'],
  },
  weekly: null,
}

function wrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children)
  }
  return Wrapper
}

describe('useBriefData', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches recaps for all markets and returns them', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockRecapPair), { status: 200 }),
    )

    const { result } = renderHook(() => useBriefData(mockBriefMarkets), {
      wrapper: wrapper(),
    })

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Should have all 3 markets
    expect(result.current.markets).toHaveLength(3)
    expect(result.current.markets[0].market.key).toBe('USA')
    expect(result.current.markets[0].recap?.summary).toBe('US markets rallied on strong earnings.')

    // fetch called 3 times (one per market)
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('handles fetch failure gracefully with null recap', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useBriefData(mockBriefMarkets), {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // All markets present but recaps are null
    expect(result.current.markets).toHaveLength(3)
    expect(result.current.markets[0].recap).toBeNull()
  })

  it('uses daily recap when available, ignoring weekly', async () => {
    const pair: MarketRecapPair = {
      daily: { ...mockRecapPair.daily!, summary: 'Daily recap' },
      weekly: {
        id: 2,
        period_start: '2026-05-25',
        period_end: '2026-05-30',
        created_at: '2026-05-30T08:00:00Z',
        summary: 'Weekly recap',
        bullets: [],
        sources: [],
        audio: null,
        questions: [],
      },
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(pair), { status: 200 }),
    )

    const { result } = renderHook(() => useBriefData(mockBriefMarkets), {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Should prefer daily
    expect(result.current.markets[0].recap?.summary).toBe('Daily recap')
  })

  it('falls back to weekly when daily is null', async () => {
    const pair: MarketRecapPair = {
      daily: null,
      weekly: {
        id: 2,
        period_start: '2026-05-25',
        period_end: '2026-05-30',
        created_at: '2026-05-30T08:00:00Z',
        summary: 'Weekly recap fallback',
        bullets: [],
        sources: [],
        audio: null,
        questions: ['What happened this week?'],
      },
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(pair), { status: 200 }),
    )

    const { result } = renderHook(() => useBriefData(mockBriefMarkets), {
      wrapper: wrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.markets[0].recap?.summary).toBe('Weekly recap fallback')
  })
})
