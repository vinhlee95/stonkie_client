import { render, screen, fireEvent } from '@testing-library/react'
import PulseCard from '../chat/PulseCard'
import type { BriefMarketData } from '../hooks/useBriefData'

const mockMarketData: BriefMarketData = {
  market: {
    key: 'USA',
    label: 'US',
    flag: '🇺🇸',
    backendCode: 'US',
    indexLabel: 'S&P 500',
    favouriteCount: 2,
  },
  recap: {
    id: 1,
    period_start: '2026-05-30',
    period_end: '2026-05-30',
    created_at: '2026-05-30T08:00:00Z',
    summary: 'Cautious upward move. Bond yields and consolidation are narratives to watch.',
    bullets: [],
    sources: [],
    audio: null,
    questions: ['Why did tech lead?'],
  },
  recapId: '1',
}

describe('PulseCard', () => {
  it('renders market flag and pulse label', () => {
    render(<PulseCard market={mockMarketData} favouriteCount={2} onDigIn={() => {}} />)
    expect(screen.getByText('🇺🇸')).toBeInTheDocument()
    expect(screen.getByText(/US Pulse/i)).toBeInTheDocument()
  })

  it('renders index label', () => {
    render(<PulseCard market={mockMarketData} favouriteCount={2} onDigIn={() => {}} />)
    expect(screen.getByText(/S&P 500/)).toBeInTheDocument()
  })

  it('renders headline from recap summary', () => {
    render(<PulseCard market={mockMarketData} favouriteCount={2} onDigIn={() => {}} />)
    expect(screen.getByText(/Cautious upward move/)).toBeInTheDocument()
  })

  it('renders favourite count when > 0', () => {
    render(<PulseCard market={mockMarketData} favouriteCount={2} onDigIn={() => {}} />)
    expect(screen.getByText(/2 favourites here/)).toBeInTheDocument()
  })

  it('hides favourite count when 0', () => {
    render(<PulseCard market={mockMarketData} favouriteCount={0} onDigIn={() => {}} />)
    expect(screen.queryByText(/favourites here/)).not.toBeInTheDocument()
  })

  it('calls onDigIn when card is clicked', () => {
    const onDigIn = vi.fn()
    render(<PulseCard market={mockMarketData} favouriteCount={2} onDigIn={onDigIn} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onDigIn).toHaveBeenCalledTimes(1)
  })
})
