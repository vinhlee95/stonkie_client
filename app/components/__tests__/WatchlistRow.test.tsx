import { render, screen, fireEvent } from '@testing-library/react'
import WatchlistRow from '../chat/WatchlistRow'
import type { Company } from '@/app/CompanyList'
import type { PriceChange } from '@/lib/api/quotes'

const company: Company = {
  name: 'NVIDIA',
  ticker: 'NVDA',
  logo_url: 'https://example.com/nvda.png',
  sector: 'Technology',
  country: 'USA',
  exchange: 'NASDAQ',
}

describe('WatchlistRow', () => {
  it('renders ticker, name, and flag', () => {
    render(<WatchlistRow company={company} flag="🇺🇸" onRemove={vi.fn()} />)
    expect(screen.getByText('NVDA')).toBeInTheDocument()
    expect(screen.getByText('NVIDIA')).toBeInTheDocument()
    expect(screen.getByText('🇺🇸')).toBeInTheDocument()
  })

  it('links to the company ticker page', () => {
    render(<WatchlistRow company={company} flag="🇺🇸" onRemove={vi.fn()} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/tickers/NVDA')
  })

  it('calls onNavigate when tapped (to close the modal)', () => {
    const onNavigate = vi.fn()
    render(<WatchlistRow company={company} flag="🇺🇸" onNavigate={onNavigate} onRemove={vi.fn()} />)
    fireEvent.click(screen.getByRole('link'))
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('sets the slide-in flag on tap so the ticker page animates in', () => {
    sessionStorage.clear()
    render(<WatchlistRow company={company} flag="🇺🇸" onRemove={vi.fn()} />)
    fireEvent.click(screen.getByRole('link'))
    expect(sessionStorage.getItem('stonkie_ticker_slidein')).toBe('1')
  })

  it('calls onRemove with the ticker without navigating', () => {
    const onRemove = vi.fn()
    const onNavigate = vi.fn()
    render(<WatchlistRow company={company} flag="🇺🇸" onNavigate={onNavigate} onRemove={onRemove} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove NVDA from favourites' }))
    expect(onRemove).toHaveBeenCalledWith('NVDA')
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('renders logo image when logo_url is present', () => {
    render(<WatchlistRow company={company} flag="🇺🇸" onRemove={vi.fn()} />)
    const img = screen.getByAltText('NVIDIA') as HTMLImageElement
    expect(img.src).toContain('nvda.png')
  })

  it('falls back to initials when no logo_url', () => {
    render(<WatchlistRow company={{ ...company, logo_url: '' }} flag="🇺🇸" onRemove={vi.fn()} />)
    expect(screen.queryByAltText('NVIDIA')).not.toBeInTheDocument()
    expect(screen.getByText('NV')).toBeInTheDocument()
  })

  describe('daily change badge', () => {
    const quote = (change: number, changePercent: number): PriceChange => ({
      trading_date: '2026-06-10',
      close: 100 + change,
      prev_close: 100,
      change,
      change_percent: changePercent,
      currency: 'USD',
    })

    it('renders no badge when quote is missing', () => {
      render(<WatchlistRow company={company} flag="🇺🇸" onRemove={vi.fn()} />)
      expect(screen.queryByText(/%$/)).not.toBeInTheDocument()
    })

    it('shows a green badge with + sign and point change for a positive change', () => {
      render(
        <WatchlistRow company={company} flag="🇺🇸" quote={quote(1.03, 0.35)} onRemove={vi.fn()} />,
      )
      const badge = screen.getByText('+0.35% (1.03)')
      expect(badge.className).toContain('text-green-600')
    })

    it('shows a red badge for a negative change with the point change unsigned', () => {
      render(
        <WatchlistRow company={company} flag="🇺🇸" quote={quote(-2.5, -1.2)} onRemove={vi.fn()} />,
      )
      const badge = screen.getByText('-1.20% (2.50)')
      expect(badge.className).toContain('text-red-600')
    })

    it('shows a neutral badge when the change is exactly zero', () => {
      render(<WatchlistRow company={company} flag="🇺🇸" quote={quote(0, 0)} onRemove={vi.fn()} />)
      const badge = screen.getByText('0.00% (0.00)')
      expect(badge.className).toContain('text-gray-500')
      expect(badge.className).not.toContain('text-green-600')
      expect(badge.className).not.toContain('text-red-600')
    })

    it('renders the closing price with a daily "D" marker', () => {
      render(
        <WatchlistRow company={company} flag="🇺🇸" quote={quote(1.03, 0.35)} onRemove={vi.fn()} />,
      )
      // close = 100 + 1.03 = 101.03
      expect(screen.getByText('101.03')).toBeInTheDocument()
      expect(screen.getByText('D')).toBeInTheDocument()
    })
  })
})
