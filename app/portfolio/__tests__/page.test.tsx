import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))
vi.mock('@/lib/auth/backendFetch', () => ({ authedBackendFetch: vi.fn() }))

import { redirect } from 'next/navigation'
import { authedBackendFetch } from '@/lib/auth/backendFetch'
import { UnauthenticatedError } from '@/lib/auth/errors'
import PortfolioPage from '../page'

const fetchMe = authedBackendFetch as unknown as ReturnType<typeof vi.fn>

beforeEach(() => vi.clearAllMocks())

describe('PortfolioPage', () => {
  it('greets the signed-in user', async () => {
    fetchMe.mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'u1', email: 'a@example.com', name: 'Ann', avatar_url: null }),
      ),
    )
    render(await PortfolioPage())
    expect(screen.getByText(/Hi Ann/)).toHaveClass('text-base', 'md:text-lg')
  })

  it('falls back to email when name is null', async () => {
    fetchMe.mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'u1', email: 'a@example.com', name: null, avatar_url: null }),
      ),
    )
    render(await PortfolioPage())
    expect(screen.getByText(/Hi a@example.com/)).toBeInTheDocument()
  })

  it('redirects to login when no session', async () => {
    fetchMe.mockRejectedValue(new UnauthenticatedError())
    await expect(PortfolioPage()).rejects.toThrow('NEXT_REDIRECT')
    expect(redirect).toHaveBeenCalledWith('/login?callbackUrl=%2Fportfolio')
  })

  it.each([
    ['backend 401', () => fetchMe.mockResolvedValue(new Response('', { status: 401 }))],
    ['network error', () => fetchMe.mockRejectedValue(new TypeError('fetch failed'))],
  ])('shows error state without redirect on %s', async (_label, arrange) => {
    arrange()
    render(await PortfolioPage())
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load your account")
    expect(redirect).not.toHaveBeenCalled()
  })
})
