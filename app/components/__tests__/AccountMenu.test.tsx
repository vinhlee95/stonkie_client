import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next-auth/react', () => ({ useSession: vi.fn(), signOut: vi.fn() }))
vi.mock('next/navigation', () => ({ usePathname: vi.fn(), useSearchParams: vi.fn() }))

import { signOut, useSession } from 'next-auth/react'
import { usePathname, useSearchParams } from 'next/navigation'
import AccountMenu from '../AccountMenu'

const mockedUseSession = useSession as unknown as ReturnType<typeof vi.fn>
const mockedPathname = usePathname as unknown as ReturnType<typeof vi.fn>
const mockedSearchParams = useSearchParams as unknown as ReturnType<typeof vi.fn>

const signedIn = () =>
  mockedUseSession.mockReturnValue({
    data: {
      user: { googleSub: 'g-1', name: 'Ann', email: 'a@example.com', image: 'https://img/a.png' },
      expires: '',
    },
    status: 'authenticated',
  })

beforeEach(() => {
  vi.clearAllMocks()
  mockedPathname.mockReturnValue('/')
  mockedSearchParams.mockReturnValue(new URLSearchParams())
})

describe('AccountMenu', () => {
  it('shows Sign in link when signed out', () => {
    mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    render(<AccountMenu />)
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login?callbackUrl=%2F',
    )
  })

  it('Sign in link returns the user to the current page', () => {
    mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    mockedPathname.mockReturnValue('/tickers/AAPL')
    mockedSearchParams.mockReturnValue(new URLSearchParams('tab=1'))
    render(<AccountMenu />)
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login?callbackUrl=%2Ftickers%2FAAPL%3Ftab%3D1',
    )
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
        user: { googleSub: 'g-1', name: 'Ann', email: 'a@example.com', image: 'https://img/a.png' },
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

  it('moves focus into the menu and supports arrow keys', async () => {
    signedIn()
    render(<AccountMenu />)

    await userEvent.click(screen.getByRole('button', { name: 'Account menu' }))
    expect(screen.getByRole('menuitem', { name: 'Portfolio' })).toHaveFocus()

    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Portfolio' })).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toHaveFocus()
  })

  it('closes on Escape and restores focus to the trigger', async () => {
    signedIn()
    render(<AccountMenu />)
    const trigger = screen.getByRole('button', { name: 'Account menu' })

    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('restores focus to the trigger when closed by clicking outside', async () => {
    signedIn()
    render(<AccountMenu />)
    const trigger = screen.getByRole('button', { name: 'Account menu' })

    await userEvent.click(trigger)
    await userEvent.click(screen.getByTestId('account-menu-backdrop'))

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('Tab closes the menu and moves focus to the control after the trigger', async () => {
    signedIn()
    render(
      <>
        <button>Before</button>
        <AccountMenu />
        <button>After</button>
      </>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Account menu' }))
    await userEvent.keyboard('{Tab}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus()
  })

  it('Shift+Tab closes the menu and moves focus to the control before the trigger', async () => {
    signedIn()
    render(
      <>
        <button>Before</button>
        <AccountMenu />
        <button>After</button>
      </>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Account menu' }))
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus()
  })

  it.each([{ email: 'a@example.com' }, { googleSub: 'g-1' }])(
    'treats incomplete session user %j as signed out',
    (user) => {
      mockedUseSession.mockReturnValue({ data: { user, expires: '' }, status: 'authenticated' })
      render(<AccountMenu />)
      expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Account menu' })).not.toBeInTheDocument()
    },
  )
})
