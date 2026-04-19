import { render, screen, waitFor } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SpotlightSearch from '../SpotlightSearch'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockCompanies = [
  { ticker: 'AAPL', name: 'Apple Inc.', logo_url: '/apple.png', sector: 'Technology' },
  { ticker: 'MSFT', name: 'Microsoft Corp', logo_url: '/msft.png', sector: 'Technology' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', logo_url: '/goog.png', sector: 'Technology' },
]

describe('SpotlightSearch', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    Element.prototype.scrollIntoView = vi.fn()
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/companies')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCompanies),
        })
      }
      // /api/tickers fallback
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    })
  })

  it('renders overlay with auto-focused input', async () => {
    render(<SpotlightSearch onClose={onClose} />)

    const input = screen.getByPlaceholderText(/search ticker or company/i)
    expect(input).toBeInTheDocument()
    await waitFor(() => {
      expect(input).toHaveFocus()
    })
  })

  it('renders backdrop', () => {
    render(<SpotlightSearch onClose={onClose} />)
    expect(screen.getByTestId('spotlight-backdrop')).toBeInTheDocument()
  })

  it('shows popular companies on mount (max 5)', async () => {
    render(<SpotlightSearch onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText('MSFT')).toBeInTheDocument()
      expect(screen.getByText('GOOGL')).toBeInTheDocument()
    })
  })

  it('filters results when typing', async () => {
    const user = userEvent.setup()
    render(<SpotlightSearch onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText(/search ticker or company/i), 'apple')

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.queryByText('MSFT')).not.toBeInTheDocument()
    })
  })

  it('navigates to ticker page on result click', async () => {
    const user = userEvent.setup()
    render(<SpotlightSearch onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })

    await user.click(screen.getByText('AAPL'))

    expect(mockPush).toHaveBeenCalledWith('/tickers/AAPL')
    expect(onClose).toHaveBeenCalled()
  })

  it('selects with keyboard navigation and Enter', async () => {
    const user = userEvent.setup()
    render(<SpotlightSearch onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/search ticker or company/i)
    await user.type(input, '{ArrowDown}{Enter}')

    expect(mockPush).toHaveBeenCalledWith('/tickers/AAPL')
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on Escape key', async () => {
    const user = userEvent.setup()
    render(<SpotlightSearch onClose={onClose} />)

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalled()
  })

  it('closes on backdrop click', async () => {
    const user = userEvent.setup()
    render(<SpotlightSearch onClose={onClose} />)

    await user.click(screen.getByTestId('spotlight-backdrop'))

    expect(onClose).toHaveBeenCalled()
  })

  it('shows no results message when local search has no matches', async () => {
    const user = userEvent.setup()
    render(<SpotlightSearch onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText(/search ticker or company/i), 'xyznonexistent')

    // No local matches — results cleared immediately, "No results found" shown
    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument()
    })
  })

  it('shows keyboard hints', () => {
    render(<SpotlightSearch onClose={onClose} />)

    expect(screen.getByText('navigate')).toBeInTheDocument()
    expect(screen.getByText('select')).toBeInTheDocument()
    expect(screen.getByText('close')).toBeInTheDocument()
  })
})
