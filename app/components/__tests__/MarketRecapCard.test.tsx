import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MarketRecapCard from '../MarketRecapCard'
import { MarketRecapItem } from '@/lib/api/marketRecap'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const weeklyRecap: MarketRecapItem = {
  id: 1,
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
  questions: [],
}

const dailyRecap: MarketRecapItem = {
  id: 2,
  period_start: '2026-04-24',
  period_end: '2026-04-24',
  created_at: '2026-04-25T01:30:00.000000Z',
  summary: 'Stocks finished the Friday session marginally higher on tech strength.',
  bullets: [{ text: 'Nvidia popped 2.4% on AI demand chatter', citations: [{ source_id: 'd1' }] }],
  sources: [
    {
      id: 'd1',
      url: 'https://example.com/daily-1',
      title: 'Daily source',
      publisher: 'Bloomberg',
      published_at: '2026-04-24T20:00:00Z',
      fetched_at: '2026-04-24T21:00:00Z',
    },
  ],
  questions: [],
}

const noop = () => {}

describe('MarketRecapCard', () => {
  it('renders recap created_at timestamp', () => {
    render(<MarketRecapCard daily={null} weekly={weeklyRecap} onDigDeeper={noop} />)

    const expectedLocalizedCreatedAt = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(weeklyRecap.created_at))

    expect(screen.queryByText(/Created at:/i)).not.toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(escapeRegExp(expectedLocalizedCreatedAt), 'i')),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText(
        new RegExp(`Recap created\\s*${escapeRegExp(expectedLocalizedCreatedAt)}`, 'i'),
      ),
    ).toBeInTheDocument()
  })

  it('renders collapsed by default with summary visible', () => {
    render(<MarketRecapCard daily={null} weekly={weeklyRecap} onDigDeeper={noop} />)

    expect(screen.getByText('Market Recap')).toBeInTheDocument()
    expect(screen.getByText(/S&P 500 closed slightly higher/i)).toBeInTheDocument()
    expect(screen.queryByText(/Tech sector led gains/i)).not.toBeInTheDocument()
  })

  it('shows bullets after expanding without ask-market chat CTA', () => {
    render(<MarketRecapCard daily={null} weekly={weeklyRecap} onDigDeeper={noop} />)

    const toggle = screen.getByRole('button', { name: /market recap/i })
    fireEvent.click(toggle)

    expect(screen.getByText(/Tech sector led gains/i)).toBeInTheDocument()
    expect(screen.getByText(/Fed held rates steady/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ask about this market/i })).not.toBeInTheDocument()
  })

  it('clamps summary only when collapsed', () => {
    render(<MarketRecapCard daily={null} weekly={weeklyRecap} onDigDeeper={noop} />)

    const summary = screen.getByText(/S&P 500 closed slightly higher/i)
    expect(summary).toHaveClass('line-clamp-6')

    fireEvent.click(screen.getByRole('button', { name: /market recap/i }))
    expect(summary).not.toHaveClass('line-clamp-6')
  })

  it('renders citation chips using publisher/site name', () => {
    render(<MarketRecapCard daily={null} weekly={weeklyRecap} onDigDeeper={noop} />)

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
      ...weeklyRecap,
      sources: [
        {
          ...weeklyRecap.sources[0],
          publisher: '',
          url: 'https://www.reuters.com/world/example-story',
        },
      ],
      bullets: [{ text: 'Fallback source example', citations: [{ source_id: 's1' }] }],
    }

    render(<MarketRecapCard daily={null} weekly={recapWithoutPublisher} onDigDeeper={noop} />)
    fireEvent.click(screen.getByRole('button', { name: /market recap/i }))

    expect(screen.getByRole('link', { name: /^reuters$/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /www\.reuters\.com/i })).not.toBeInTheDocument()
  })

  it('normalizes publisher value when publisher itself is a website', () => {
    const recapWithWebsitePublisher: MarketRecapItem = {
      ...weeklyRecap,
      sources: [
        {
          ...weeklyRecap.sources[0],
          publisher: 'www.reuters.com',
        },
      ],
      bullets: [{ text: 'Publisher website example', citations: [{ source_id: 's1' }] }],
    }

    render(<MarketRecapCard daily={null} weekly={recapWithWebsitePublisher} onDigDeeper={noop} />)
    fireEvent.click(screen.getByRole('button', { name: /market recap/i }))

    expect(screen.getByRole('link', { name: /^reuters$/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /www\.reuters\.com/i })).not.toBeInTheDocument()
  })

  it('shows source detail popup on chip hover', () => {
    render(<MarketRecapCard daily={null} weekly={weeklyRecap} onDigDeeper={noop} />)
    fireEvent.click(screen.getByRole('button', { name: /market recap/i }))

    const sourceChip = screen.getByRole('link', { name: /reuters/i })
    fireEvent.mouseEnter(sourceChip)

    const tooltip = screen.getByRole('tooltip')
    expect(within(tooltip).getByText(/Title:/i)).toBeInTheDocument()
    expect(within(tooltip).getByText(/Publisher:/i)).toBeInTheDocument()
    expect(within(tooltip).getByText(/Published at:/i)).toBeInTheDocument()
    expect(within(tooltip).getByText(/Source 1/i)).toBeInTheDocument()
    expect(within(tooltip).getAllByText(/Reuters/i).length).toBeGreaterThan(0)
    expect(within(tooltip).getByText(/2026-04-24T12:00:00Z/i)).toBeInTheDocument()
  })

  it('shows only one tooltip when same source appears across multiple bullets', () => {
    const recapWithDuplicateSource: MarketRecapItem = {
      ...weeklyRecap,
      bullets: [
        { text: 'Bullet A', citations: [{ source_id: 's1' }] },
        { text: 'Bullet B', citations: [{ source_id: 's1' }] },
      ],
    }

    render(<MarketRecapCard daily={null} weekly={recapWithDuplicateSource} onDigDeeper={noop} />)
    fireEvent.click(screen.getByRole('button', { name: /market recap/i }))

    const reutersLinks = screen.getAllByRole('link', { name: /reuters/i })
    fireEvent.mouseEnter(reutersLinks[0]!)

    expect(screen.getAllByRole('tooltip')).toHaveLength(1)
  })

  describe('cadence toggle', () => {
    it('renders daily content by default when both cadences are provided', () => {
      render(<MarketRecapCard daily={dailyRecap} weekly={weeklyRecap} onDigDeeper={noop} />)

      expect(screen.getByText(/Stocks finished the Friday session/i)).toBeInTheDocument()
      expect(screen.queryByText(/S&P 500 closed slightly higher/i)).not.toBeInTheDocument()
    })

    it('renders Daily and Weekly pill toggles when both cadences are provided', () => {
      render(<MarketRecapCard daily={dailyRecap} weekly={weeklyRecap} onDigDeeper={noop} />)

      expect(screen.getByRole('button', { name: /^daily$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^weekly$/i })).toBeInTheDocument()
    })

    it('switches displayed summary when Weekly pill is clicked', () => {
      render(<MarketRecapCard daily={dailyRecap} weekly={weeklyRecap} onDigDeeper={noop} />)

      fireEvent.click(screen.getByRole('button', { name: /^weekly$/i }))

      expect(screen.getByText(/S&P 500 closed slightly higher/i)).toBeInTheDocument()
      expect(screen.queryByText(/Stocks finished the Friday session/i)).not.toBeInTheDocument()
    })

    it('does not expand the card when toggling cadence', () => {
      render(<MarketRecapCard daily={dailyRecap} weekly={weeklyRecap} onDigDeeper={noop} />)

      fireEvent.click(screen.getByRole('button', { name: /^weekly$/i }))

      // Bullet text from expanded body should not be present.
      expect(screen.queryByText(/Tech sector led gains/i)).not.toBeInTheDocument()
    })

    it('hides the pill toggle when only weekly is provided', () => {
      render(<MarketRecapCard daily={null} weekly={weeklyRecap} onDigDeeper={noop} />)

      expect(screen.queryByRole('button', { name: /^daily$/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^weekly$/i })).not.toBeInTheDocument()
    })

    it('hides the pill toggle when only daily is provided', () => {
      render(<MarketRecapCard daily={dailyRecap} weekly={null} onDigDeeper={noop} />)

      expect(screen.queryByRole('button', { name: /^daily$/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^weekly$/i })).not.toBeInTheDocument()
      expect(screen.getByText(/Stocks finished the Friday session/i)).toBeInTheDocument()
    })
  })

  describe('period pill', () => {
    it('renders a single date for a daily recap (period_start === period_end)', () => {
      render(<MarketRecapCard daily={dailyRecap} weekly={null} onDigDeeper={noop} />)

      const expected = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
        new Date('2026-04-24T00:00:00Z'),
      )
      expect(
        screen.getByLabelText(new RegExp(`Recap period\\s*${escapeRegExp(expected)}`, 'i')),
      ).toBeInTheDocument()
    })

    it('renders a date range for a weekly recap', () => {
      render(<MarketRecapCard daily={null} weekly={weeklyRecap} onDigDeeper={noop} />)

      const start = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
        new Date('2026-04-20T00:00:00Z'),
      )
      const end = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
        new Date('2026-04-24T00:00:00Z'),
      )
      const label = screen.getByLabelText(/Recap period/i)
      expect(label.textContent ?? '').toContain(start)
      expect(label.textContent ?? '').toContain(end)
    })

    it('renders both period and created_at chips at the same time', () => {
      render(<MarketRecapCard daily={null} weekly={weeklyRecap} onDigDeeper={noop} />)

      expect(screen.getByLabelText(/Recap period/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Recap created/i)).toBeInTheDocument()
    })

    it('places the created_at chip after the summary text in DOM order', () => {
      render(<MarketRecapCard daily={null} weekly={weeklyRecap} onDigDeeper={noop} />)

      const summary = screen.getByText(/S&P 500 closed slightly higher/i)
      const createdAtChip = screen.getByLabelText(/Recap created/i)

      const order = summary.compareDocumentPosition(createdAtChip)
      expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('prefixes the created_at chip with "Curated on:"', () => {
      render(<MarketRecapCard daily={null} weekly={weeklyRecap} onDigDeeper={noop} />)

      const chip = screen.getByLabelText(/Recap created/i)
      expect(chip.textContent ?? '').toMatch(/Curated on:/i)
    })

    it('updates the period chip when the cadence is toggled', () => {
      render(<MarketRecapCard daily={dailyRecap} weekly={weeklyRecap} onDigDeeper={noop} />)

      const dailyExpected = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
        new Date('2026-04-24T00:00:00Z'),
      )
      expect(
        screen.getByLabelText(new RegExp(`Recap period\\s*${escapeRegExp(dailyExpected)}`, 'i')),
      ).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /^weekly$/i }))

      const weeklyLabel = screen.getByLabelText(/Recap period/i)
      const start = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
        new Date('2026-04-20T00:00:00Z'),
      )
      expect(weeklyLabel.textContent ?? '').toContain(start)
    })
  })

  describe('Dig deeper button', () => {
    it('is hidden when collapsed', () => {
      render(<MarketRecapCard daily={null} weekly={weeklyRecap} onDigDeeper={noop} />)
      expect(screen.queryByRole('button', { name: /dig deeper/i })).not.toBeInTheDocument()
    })

    it('appears in expanded state', () => {
      render(<MarketRecapCard daily={null} weekly={weeklyRecap} onDigDeeper={noop} />)

      fireEvent.click(screen.getByRole('button', { name: /market recap/i }))
      expect(screen.getByRole('button', { name: /dig deeper/i })).toBeInTheDocument()
    })

    it('fires onDigDeeper with current cadence on click', () => {
      const handler = vi.fn()
      render(<MarketRecapCard daily={null} weekly={weeklyRecap} onDigDeeper={handler} />)

      fireEvent.click(screen.getByRole('button', { name: /market recap/i }))
      fireEvent.click(screen.getByRole('button', { name: /dig deeper/i }))
      expect(handler).toHaveBeenCalledWith('weekly')
    })
  })
})
