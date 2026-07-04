import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TickerRecapCard from '../TickerRecapCard'
import type { TickerRecapItem } from '@/lib/api/tickerRecap'

const weeklyRecap: TickerRecapItem = {
  id: 1,
  period_start: '2026-06-28',
  period_end: '2026-07-02',
  created_at: '2026-07-03T05:00:00Z',
  summary: 'Apple gained 6.2% on the week and finished at a fresh record.',
  bullets: [
    { text: 'Shares set new all-time closing highs on Thursday and Friday.', citations: [] },
    { text: 'Market cap crossed $4.25T.', citations: [{ source_id: 's1' }] },
  ],
  sources: [
    {
      id: 's1',
      url: 'https://example.com/1',
      title: 'Source 1',
      publisher: 'Reuters',
      published_at: '2026-07-02T12:00:00Z',
      fetched_at: '2026-07-03T12:00:00Z',
    },
  ],
  price_change: null,
}

const dailyRecap: TickerRecapItem = {
  id: 2,
  period_start: '2026-07-02',
  period_end: '2026-07-02',
  created_at: '2026-07-03T05:00:00Z',
  summary: 'Apple jumped 4.8% to $308.63 after strong services guidance.',
  bullets: [{ text: 'Services guidance topped consensus.', citations: [] }],
  sources: [],
  price_change: null,
}

describe('TickerRecapCard', () => {
  it('renders the ticker-scoped label and summary, expanded by default', () => {
    render(<TickerRecapCard symbol="AAPL" daily={dailyRecap} weekly={null} />)

    expect(screen.getByText('AAPL Recap')).toBeInTheDocument()
    expect(screen.getByText(/Apple jumped 4.8%/i)).toBeInTheDocument()
    // Bullets visible without interaction (expanded by default).
    expect(screen.getByText(/Services guidance topped consensus/i)).toBeInTheDocument()
  })

  it('does not render a Dig deeper button', () => {
    render(<TickerRecapCard symbol="AAPL" daily={dailyRecap} weekly={null} />)
    expect(screen.queryByRole('button', { name: /dig deeper/i })).not.toBeInTheDocument()
  })

  it('collapses bullets when the collapse control is toggled', () => {
    render(<TickerRecapCard symbol="AAPL" daily={dailyRecap} weekly={null} />)

    fireEvent.click(screen.getByRole('button', { name: /collapse recap/i }))
    expect(screen.getByRole('button', { name: /expand recap/i })).toBeInTheDocument()
  })

  it('shows the Daily/Weekly toggle only when both cadences exist', () => {
    const { rerender } = render(
      <TickerRecapCard symbol="AAPL" daily={dailyRecap} weekly={weeklyRecap} />,
    )
    expect(screen.getByRole('button', { name: /^daily$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^weekly$/i })).toBeInTheDocument()

    rerender(<TickerRecapCard symbol="AAPL" daily={dailyRecap} weekly={null} />)
    expect(screen.queryByRole('button', { name: /^weekly$/i })).not.toBeInTheDocument()
  })

  it('switches the summary when Weekly is selected', () => {
    render(<TickerRecapCard symbol="AAPL" daily={dailyRecap} weekly={weeklyRecap} />)

    expect(screen.getByText(/Apple jumped 4.8%/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^weekly$/i }))
    expect(screen.getByText(/Apple gained 6.2%/i)).toBeInTheDocument()
    expect(screen.queryByText(/Apple jumped 4.8%/i)).not.toBeInTheDocument()
  })

  it('renders period and curated chips, and citation chips using publisher name', () => {
    render(<TickerRecapCard symbol="AAPL" daily={null} weekly={weeklyRecap} />)

    expect(screen.getByLabelText(/Recap period/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Recap created/i)).toBeInTheDocument()
    const source = screen.getByRole('link', { name: /reuters/i })
    expect(source).toHaveAttribute('href', 'https://example.com/1')
  })

  it('returns null when neither cadence has data', () => {
    const { container } = render(<TickerRecapCard symbol="AAPL" daily={null} weekly={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
