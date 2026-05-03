import { fireEvent, render, screen, within } from '@/tests/test-utils'
import ChatSourceChips from '../ChatSourceChips'

describe('ChatSourceChips', () => {
  it('renders source chips using publisher labels', () => {
    render(
      <ChatSourceChips
        sources={[
          {
            sourceId: 's1',
            url: 'https://www.reuters.com/story',
            publisher: 'Reuters',
            title: '',
            publishedAt: '2026-05-01T12:00:00Z',
          },
        ]}
      />,
    )

    const chip = screen.getByRole('link', { name: /^reuters$/i })
    expect(chip).toHaveAttribute('href', 'https://www.reuters.com/story')
    expect(chip).toHaveAttribute('target', '_blank')
    expect(chip).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('falls back to hostname, then title, for the chip label', () => {
    const { rerender } = render(
      <ChatSourceChips
        sources={[
          {
            sourceId: 's1',
            url: 'https://www.cnbc.com/2026/05/01/apple-story.html',
            publisher: '',
            title: '',
          },
        ]}
      />,
    )

    expect(screen.getByRole('link', { name: /^cnbc$/i })).toBeInTheDocument()

    rerender(
      <ChatSourceChips
        sources={[
          {
            sourceId: 's2',
            title: 'Apple internal memo',
          },
        ]}
      />,
    )

    expect(screen.getByText('Apple internal memo')).toBeInTheDocument()
  })

  it('shows structured tooltip metadata on hover', () => {
    render(
      <ChatSourceChips
        sources={[
          {
            sourceId: 's1',
            url: 'https://www.reuters.com/story',
            publisher: 'Reuters',
            title: 'Apple Q2 results',
            publishedAt: '2026-05-01T12:00:00Z',
          },
        ]}
      />,
    )

    const chip = screen.getByRole('link', { name: /^reuters$/i })
    fireEvent.mouseEnter(chip)

    const tooltip = screen.getByRole('tooltip')
    expect(within(tooltip).getByText(/Title:/i)).toBeInTheDocument()
    expect(within(tooltip).getByText(/Publisher:/i)).toBeInTheDocument()
    expect(within(tooltip).getByText(/Published at:/i)).toBeInTheDocument()
    expect(within(tooltip).getByText(/Apple Q2 results/i)).toBeInTheDocument()
    expect(within(tooltip).getAllByText(/Reuters/i).length).toBeGreaterThan(0)
    expect(within(tooltip).getByText(/2026-05-01T12:00:00Z/i)).toBeInTheDocument()
  })

  it('renders nothing for an empty source list', () => {
    const { container } = render(<ChatSourceChips sources={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
