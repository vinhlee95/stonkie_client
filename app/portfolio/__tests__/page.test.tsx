import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@/tests/test-utils'
import type { Portfolio } from '@/lib/api/portfolio'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))
vi.mock('@/lib/auth/server', () => ({ authedBackendFetch: vi.fn() }))

import { redirect } from 'next/navigation'
import { authedBackendFetch } from '@/lib/auth/server'
import { UnauthenticatedError } from '@/lib/auth/shared'
import PortfolioPage from '../page'

const fetchPortfolio = authedBackendFetch as unknown as ReturnType<typeof vi.fn>

const EMPTY: Portfolio = {
  base_currency: 'EUR',
  summary: {
    holdings_count: 0,
    priced_count: 0,
    total_value: 0,
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

beforeEach(() => vi.clearAllMocks())

describe('PortfolioPage', () => {
  it('fetches the portfolio from the backend', async () => {
    fetchPortfolio.mockResolvedValue(new Response(JSON.stringify(EMPTY)))
    render(await PortfolioPage())
    expect(fetchPortfolio).toHaveBeenCalledWith('/api/me/portfolio')
    expect(screen.getByRole('heading', { name: 'Track what you own' })).toBeInTheDocument()
  })

  it('redirects to login when no session', async () => {
    fetchPortfolio.mockRejectedValue(new UnauthenticatedError())
    await expect(PortfolioPage()).rejects.toThrow('NEXT_REDIRECT')
    expect(redirect).toHaveBeenCalledWith('/login?callbackUrl=%2Fportfolio')
  })

  it.each([
    ['backend 500', () => fetchPortfolio.mockResolvedValue(new Response('', { status: 500 }))],
    ['network error', () => fetchPortfolio.mockRejectedValue(new TypeError('fetch failed'))],
  ])('shows error state without redirect on %s', async (_label, arrange) => {
    arrange()
    render(await PortfolioPage())
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load your portfolio")
    expect(redirect).not.toHaveBeenCalled()
  })
})
