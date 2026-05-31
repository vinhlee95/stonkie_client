import { render, screen, fireEvent } from '@testing-library/react'
import WatchlistRow from '../chat/WatchlistRow'
import type { Company } from '@/app/CompanyList'

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
    render(<WatchlistRow company={company} flag="🇺🇸" />)
    expect(screen.getByText('NVDA')).toBeInTheDocument()
    expect(screen.getByText('NVIDIA')).toBeInTheDocument()
    expect(screen.getByText('🇺🇸')).toBeInTheDocument()
  })

  it('links to the company ticker page', () => {
    render(<WatchlistRow company={company} flag="🇺🇸" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/tickers/NVDA')
  })

  it('calls onNavigate when tapped (to close the modal)', () => {
    const onNavigate = vi.fn()
    render(<WatchlistRow company={company} flag="🇺🇸" onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('link'))
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('sets the slide-in flag on tap so the ticker page animates in', () => {
    sessionStorage.clear()
    render(<WatchlistRow company={company} flag="🇺🇸" />)
    fireEvent.click(screen.getByRole('link'))
    expect(sessionStorage.getItem('stonkie_ticker_slidein')).toBe('1')
  })

  it('renders logo image when logo_url is present', () => {
    render(<WatchlistRow company={company} flag="🇺🇸" />)
    const img = screen.getByAltText('NVIDIA') as HTMLImageElement
    expect(img.src).toContain('nvda.png')
  })

  it('falls back to initials when no logo_url', () => {
    render(<WatchlistRow company={{ ...company, logo_url: '' }} flag="🇺🇸" />)
    expect(screen.queryByAltText('NVIDIA')).not.toBeInTheDocument()
    expect(screen.getByText('NV')).toBeInTheDocument()
  })
})
