import { act, fireEvent, render, screen } from '@testing-library/react'
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
    expect(screen.getByText(/U\.S\. stocks finished higher/i)).toBeInTheDocument()
    // Header + context card both show this text
    expect(screen.getAllByText(/USA Daily Recap/i).length).toBeGreaterThanOrEqual(1)
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
    expect(screen.getByText(/How will reduced Fed rate cut/i)).toBeInTheDocument()
    expect(screen.getByText(/What caused HubSpot/i)).toBeInTheDocument()
  })

  it('questions persist when recap changes (e.g. cadence toggle)', async () => {
    vi.useFakeTimers()

    const weeklyRecap: MarketRecapItem = {
      id: 200,
      period_start: '2026-05-04',
      period_end: '2026-05-08',
      created_at: '2026-05-09T07:00:00Z',
      summary: 'Weekly summary text.',
      bullets: [],
      sources: [],
      questions: ['What drove the weekly rally?', 'Is the trend sustainable?'],
    }

    // Start with daily recap
    const { rerender } = render(
      <RecapChatModal open={true} onClose={vi.fn()} recap={recap} market="USA" cadence="daily" />,
    )
    expect(screen.getByText(/How will reduced Fed rate cut/i)).toBeInTheDocument()

    // Switch to weekly recap (simulates toggling cadence then reopening)
    rerender(
      <RecapChatModal
        open={true}
        onClose={vi.fn()}
        recap={weeklyRecap}
        market="USA"
        cadence="weekly"
      />,
    )

    // Flush the setTimeout in useChatState that clears threads on scope change
    await act(async () => {
      vi.runAllTimers()
    })

    expect(screen.getByText(/What drove the weekly rally/i)).toBeInTheDocument()
    expect(screen.getByText(/Is the trend sustainable/i)).toBeInTheDocument()
    vi.useRealTimers()
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
