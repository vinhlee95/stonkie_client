import { render, screen, fireEvent } from '@testing-library/react'
import CollapsedMarketRow from '../chat/CollapsedMarketRow'
import type { BriefMarketData } from '../hooks/useBriefData'

const mockMarket: BriefMarketData = {
  market: {
    key: 'Finland',
    label: 'Finland',
    flag: '🇫🇮',
    backendCode: 'FI',
    indexLabel: 'OMXH25',
    favouriteCount: 1,
  },
  recap: {
    id: 2,
    period_start: '2026-05-30',
    period_end: '2026-05-30',
    created_at: '2026-05-30T08:00:00Z',
    summary: 'Helsinki extended its weekly rally. Weaker EUR supports exporters.',
    bullets: [],
    sources: [],
    audio: null,
    questions: [
      'Why is Nokia up today?',
      'How are ECB rate expectations affecting Finnish stocks?',
      'Compare OMXH25 to Stoxx 600',
    ],
  },
  recapId: '2',
}

const defaultProps = {
  market: mockMarket,
  favouriteCount: 1,
  expanded: false,
  onToggle: vi.fn(),
  onDigIn: vi.fn(),
  onAskQuestion: vi.fn(),
}

describe('CollapsedMarketRow', () => {
  it('shows flag, label, and headline snippet when collapsed', () => {
    render(<CollapsedMarketRow {...defaultProps} />)
    expect(screen.getByText('🇫🇮')).toBeInTheDocument()
    expect(screen.getByText('Finland')).toBeInTheDocument()
    // First sentence truncated
    expect(screen.getByText(/Helsinki extended/)).toBeInTheDocument()
  })

  it('shows favourite count when > 0', () => {
    render(<CollapsedMarketRow {...defaultProps} />)
    expect(screen.getByText(/1 favourite/)).toBeInTheDocument()
  })

  it('calls onToggle when row is clicked', () => {
    const onToggle = vi.fn()
    render(<CollapsedMarketRow {...defaultProps} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button', { name: /Finland/i }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('shows full headline and chips when expanded', () => {
    render(<CollapsedMarketRow {...defaultProps} expanded={true} />)
    // Full headline visible
    expect(screen.getByText(/Weaker EUR supports exporters/)).toBeInTheDocument()
    // Dig into pulse chip
    expect(screen.getByText('Dig into pulse')).toBeInTheDocument()
    // Question chips (up to 2)
    expect(screen.getByText(/Why is Nokia up today/)).toBeInTheDocument()
    expect(screen.getByText(/How are ECB rate/)).toBeInTheDocument()
  })

  it('caps question chips at 2', () => {
    render(<CollapsedMarketRow {...defaultProps} expanded={true} />)
    // Third question should not appear as a chip
    expect(screen.queryByText(/Compare OMXH25 to Stoxx 600/)).not.toBeInTheDocument()
  })

  it('calls onDigIn when "Dig into pulse" is clicked', () => {
    const onDigIn = vi.fn()
    render(<CollapsedMarketRow {...defaultProps} expanded={true} onDigIn={onDigIn} />)
    fireEvent.click(screen.getByText('Dig into pulse'))
    expect(onDigIn).toHaveBeenCalledTimes(1)
  })

  it('calls onAskQuestion when a question chip is clicked', () => {
    const onAskQuestion = vi.fn()
    render(<CollapsedMarketRow {...defaultProps} expanded={true} onAskQuestion={onAskQuestion} />)
    fireEvent.click(screen.getByText(/Why is Nokia up today/))
    expect(onAskQuestion).toHaveBeenCalledWith('Why is Nokia up today?')
  })
})
