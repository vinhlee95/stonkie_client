import { beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@/tests/test-utils'
import { PORTFOLIO_QUERY_KEY } from '@/lib/api/portfolio'
import { PORTFOLIO } from '@/app/portfolio/__tests__/chatFixtures'

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }))
vi.mock('../Chat', () => ({
  default: () => <div>general chat</div>,
  ChatProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/app/portfolio/components/PortfolioChat', () => ({
  default: () => <div>portfolio chat</div>,
}))
vi.mock('../AccountMenu', () => ({ default: () => null }))
vi.mock('../SpotlightSearch', () => ({ default: () => null }))
vi.mock('../hooks/usePopularCompanies', () => ({ usePopularCompanies: vi.fn() }))

import { usePathname } from 'next/navigation'
import BottomNavigation from '../BottomNavigation'

const pathname = usePathname as unknown as ReturnType<typeof vi.fn>

async function openChat(path: string, portfolio?: typeof PORTFOLIO) {
  pathname.mockReturnValue(path)
  const { queryClient } = render(<BottomNavigation />, {})
  if (portfolio) queryClient.setQueryData(PORTFOLIO_QUERY_KEY, portfolio)
  await userEvent.click(screen.getByRole('button', { name: 'Chat' }))
}

beforeEach(() => vi.clearAllMocks())

describe('BottomNavigation chat button', () => {
  it('opens Portfolio chat on /portfolio when the user has holdings', async () => {
    await openChat('/portfolio', PORTFOLIO)
    expect(screen.getByText('portfolio chat')).toBeInTheDocument()
  })

  it('opens the general chat on /portfolio with no holdings', async () => {
    await openChat('/portfolio', { ...PORTFOLIO, holdings: [] })
    expect(screen.getByText('general chat')).toBeInTheDocument()
  })

  it('opens the general chat on other pages', async () => {
    await openChat('/', PORTFOLIO)
    expect(screen.getByText('general chat')).toBeInTheDocument()
  })
})
