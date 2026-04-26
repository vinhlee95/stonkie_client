import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MarketRecapCard from '../MarketRecapCard'
import { MarketRecapItem } from '@/lib/api/marketRecap'

const recap: MarketRecapItem = {
  period_start: '2026-04-20',
  period_end: '2026-04-24',
  created_at: '2026-04-25T13:18:03.721444Z',
  summary:
    'The S&P 500 closed slightly higher on Friday, led by technology and communication services.',
  bullets: [
    { text: 'Tech sector led gains with +1.2%', citations: [{ source_id: 's1' }] },
    { text: 'Fed held rates steady', citations: [{ source_id: 's2' }] },
  ],
  sources: [
    {
      id: 's1',
      url: 'https://example.com/1',
      title: 'Source 1',
      publisher: 'Reuters',
      published_at: '2026-04-24T12:00:00Z',
      fetched_at: '2026-04-25T12:00:00Z',
    },
    {
      id: 's2',
      url: 'https://example.com/2',
      title: 'Source 2',
      publisher: 'MarketWatch',
      published_at: '2026-04-24T13:00:00Z',
      fetched_at: '2026-04-25T12:10:00Z',
    },
  ],
}

describe('MarketRecapCard', () => {
  it('renders collapsed by default with summary visible', () => {
    render(<MarketRecapCard recap={recap} />)

    expect(screen.getByText('Market Recap')).toBeInTheDocument()
    expect(screen.getByText(/S&P 500 closed slightly higher/i)).toBeInTheDocument()
    expect(screen.queryByText(/Tech sector led gains/i)).not.toBeInTheDocument()
  })

  it('shows bullets and CTA after expanding', () => {
    render(<MarketRecapCard recap={recap} />)

    const toggle = screen.getByRole('button', { name: /market recap/i })
    fireEvent.click(toggle)

    expect(screen.getByText(/Tech sector led gains/i)).toBeInTheDocument()
    expect(screen.getByText(/Fed held rates steady/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ask about this market/i })).toBeInTheDocument()
  })

  it('clamps summary only when collapsed', () => {
    render(<MarketRecapCard recap={recap} />)

    const summary = screen.getByText(/S&P 500 closed slightly higher/i)
    expect(summary).toHaveClass('line-clamp-3')

    fireEvent.click(screen.getByRole('button', { name: /market recap/i }))
    expect(summary).not.toHaveClass('line-clamp-3')
  })

  it('renders citation chips using publisher/site name', () => {
    render(<MarketRecapCard recap={recap} />)

    fireEvent.click(screen.getByRole('button', { name: /market recap/i }))

    expect(screen.queryByRole('link', { name: /\[1\]/i })).not.toBeInTheDocument()

    const source1 = screen.getByRole('link', { name: /reuters/i })
    expect(source1).toHaveAttribute('href', 'https://example.com/1')
    expect(source1).toHaveAttribute('target', '_blank')
    expect(source1).toHaveAttribute('rel', 'noopener noreferrer')

    const source2 = screen.getByRole('link', { name: /marketwatch/i })
    expect(source2).toHaveAttribute('href', 'https://example.com/2')
  })

  it('normalizes hostname fallback into clean brand-like labels', () => {
    const recapWithoutPublisher: MarketRecapItem = {
      ...recap,
      sources: [
        {
          ...recap.sources[0],
          publisher: '',
          url: 'https://www.reuters.com/world/example-story',
        },
      ],
      bullets: [{ text: 'Fallback source example', citations: [{ source_id: 's1' }] }],
    }

    render(<MarketRecapCard recap={recapWithoutPublisher} />)
    fireEvent.click(screen.getByRole('button', { name: /market recap/i }))

    expect(screen.getByRole('link', { name: /^reuters$/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /www\.reuters\.com/i })).not.toBeInTheDocument()
  })

  it('normalizes publisher value when publisher itself is a website', () => {
    const recapWithWebsitePublisher: MarketRecapItem = {
      ...recap,
      sources: [
        {
          ...recap.sources[0],
          publisher: 'www.reuters.com',
        },
      ],
      bullets: [{ text: 'Publisher website example', citations: [{ source_id: 's1' }] }],
    }

    render(<MarketRecapCard recap={recapWithWebsitePublisher} />)
    fireEvent.click(screen.getByRole('button', { name: /market recap/i }))

    expect(screen.getByRole('link', { name: /^reuters$/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /www\.reuters\.com/i })).not.toBeInTheDocument()
  })

  it('shows source detail popup on chip hover', () => {
    render(<MarketRecapCard recap={recap} />)
    fireEvent.click(screen.getByRole('button', { name: /market recap/i }))

    const sourceChip = screen.getByRole('link', { name: /reuters/i })
    fireEvent.mouseEnter(sourceChip)

    const tooltip = screen.getByRole('tooltip')
    expect(within(tooltip).getByText(/Website:/i)).toBeInTheDocument()
    expect(within(tooltip).getByText(/Title:/i)).toBeInTheDocument()
    expect(within(tooltip).getByText(/Publisher:/i)).toBeInTheDocument()
    expect(within(tooltip).getByText(/Published at:/i)).toBeInTheDocument()
    expect(within(tooltip).getByText(/Source 1/i)).toBeInTheDocument()
    expect(within(tooltip).getAllByText(/Reuters/i).length).toBeGreaterThan(0)
    expect(within(tooltip).getByText(/2026-04-24T12:00:00Z/i)).toBeInTheDocument()
  })

  it('shows only one tooltip when same source appears across multiple bullets', () => {
    const recapWithDuplicateSource: MarketRecapItem = {
      ...recap,
      bullets: [
        { text: 'Bullet A', citations: [{ source_id: 's1' }] },
        { text: 'Bullet B', citations: [{ source_id: 's1' }] },
      ],
    }

    render(<MarketRecapCard recap={recapWithDuplicateSource} />)
    fireEvent.click(screen.getByRole('button', { name: /market recap/i }))

    const reutersLinks = screen.getAllByRole('link', { name: /reuters/i })
    fireEvent.mouseEnter(reutersLinks[0]!)

    expect(screen.getAllByRole('tooltip')).toHaveLength(1)
  })
})
