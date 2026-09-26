import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next-auth/react', () => ({ useSession: vi.fn(), signOut: vi.fn() }))

import { signOut, useSession } from 'next-auth/react'
import AccountMenu from '../AccountMenu'

const mockedUseSession = useSession as unknown as ReturnType<typeof vi.fn>

beforeEach(() => vi.clearAllMocks())

describe('AccountMenu', () => {
  it('shows Sign in link when signed out', () => {
    mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    render(<AccountMenu />)
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
  })

  it('renders neither link nor menu while loading', () => {
    mockedUseSession.mockReturnValue({ data: null, status: 'loading' })
    render(<AccountMenu />)
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Account menu' })).not.toBeInTheDocument()
  })

  it('opens menu with Portfolio and Sign out when signed in', async () => {
    mockedUseSession.mockReturnValue({
      data: {
        user: { name: 'Ann', email: 'a@example.com', image: 'https://img/a.png' },
        expires: '',
      },
      status: 'authenticated',
    })
    render(<AccountMenu />)

    await userEvent.click(screen.getByRole('button', { name: 'Account menu' }))
    expect(screen.getByRole('menuitem', { name: 'Portfolio' })).toHaveAttribute(
      'href',
      '/portfolio',
    )

    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }))
    expect(signOut).toHaveBeenCalledWith({ redirectTo: '/' })
  })
})
