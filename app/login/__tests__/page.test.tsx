import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))
vi.mock('@/auth', () => ({ auth: vi.fn(), signIn: vi.fn() }))

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import LoginPage from '../page'

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>
const params = (value: Record<string, string>) => ({ searchParams: Promise.resolve(value) })

beforeEach(() => vi.clearAllMocks())

describe('LoginPage', () => {
  it('redirects a fully signed-in user to the sanitized callbackUrl', async () => {
    mockedAuth.mockResolvedValue({
      user: { googleSub: 'g-1', email: 'a@example.com' },
      expires: '',
    })

    await expect(LoginPage(params({ callbackUrl: '/tickers/AAPL' }))).rejects.toThrow(
      'NEXT_REDIRECT',
    )
    expect(redirect).toHaveBeenCalledWith('/tickers/AAPL')
  })

  // /portfolio rejects such a session (UnauthenticatedError → /login); redirecting back would loop forever.
  it.each([{ email: 'a@example.com' }, { googleSub: 'g-1' }])(
    'shows sign-in instead of redirecting for incomplete session user %j',
    async (user) => {
      mockedAuth.mockResolvedValue({ user, expires: '' })

      render(await LoginPage(params({ callbackUrl: '/portfolio' })))

      expect(redirect).not.toHaveBeenCalled()
      expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
    },
  )

  it('shows the Google logo inside the sign-in button', async () => {
    mockedAuth.mockResolvedValue(null)

    render(await LoginPage(params({})))

    const button = screen.getByRole('button', { name: 'Continue with Google' })
    expect(button.querySelector('svg[data-testid="google-logo"]')).toBeInTheDocument()
  })
})
