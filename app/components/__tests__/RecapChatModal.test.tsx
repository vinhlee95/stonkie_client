import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import RecapChatModal from '../RecapChatModal'
import { MarketRecapItem } from '@/lib/api/marketRecap'

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

const recap: MarketRecapItem = {
  id: 91,
  period_start: '2026-05-08',
  period_end: '2026-05-08',
  created_at: '2026-05-09T07:00:00Z',
  summary: 'U.S. stocks finished higher on Friday, with the S&P 500 reaching record territory.',
  bullets: [{ text: 'S&P 500 climbed 0.84%', citations: [{ source_id: 's1' }] }],
  sources: [
    {
      id: 's1',
      url: 'https://example.com/1',
      title: 'Source',
      publisher: 'Reuters',
      published_at: '2026-05-08T20:00:00Z',
      fetched_at: '2026-05-08T21:00:00Z',
    },
  ],
  questions: [
    'How will reduced Fed rate cut expectations impact markets?',
    "What caused HubSpot's plunge?",
  ],
}

describe('RecapChatModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <RecapChatModal open={false} onClose={vi.fn()} recap={recap} market="USA" cadence="daily" />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('shows recap context card when open', () => {
    render(
      <RecapChatModal open={true} onClose={vi.fn()} recap={recap} market="USA" cadence="daily" />,
    )
    expect(screen.getByText(/Digging deeper into/i)).toBeInTheDocument()
    expect(screen.getByText(/U\.S\. stocks finished higher/i)).toBeInTheDocument()
    expect(screen.getByText(/USA Daily Recap/i)).toBeInTheDocument()
  })

  it('renders a functional text input', () => {
    render(
      <RecapChatModal open={true} onClose={vi.fn()} recap={recap} market="USA" cadence="daily" />,
    )
    const textarea = screen.getByRole('textbox')
    expect(textarea).not.toBeDisabled()
  })

  it('seeds suggested questions from recap.questions', () => {
    render(
      <RecapChatModal open={true} onClose={vi.fn()} recap={recap} market="USA" cadence="daily" />,
    )
    expect(screen.getByText('Dig deeper into this recap')).toBeInTheDocument()
    expect(screen.getByText(/How will reduced Fed rate cut/i)).toBeInTheDocument()
    expect(screen.getByText(/What caused HubSpot/i)).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <RecapChatModal open={true} onClose={onClose} recap={recap} market="USA" cadence="daily" />,
    )
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
