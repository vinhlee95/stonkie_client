import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import FavouriteCard from '../FavouriteCard'
import type { Company } from '@/app/CompanyList'
import type { TickerRecapItem } from '@/lib/api/tickerRecap'

const company: Company = {
  name: 'NVIDIA Corporation',
  ticker: 'NVDA',
  logo_url: 'https://example.com/nvda.png',
  sector: 'Technology',
  country: 'USA',
  exchange: 'NASDAQ',
}

const recap: TickerRecapItem = {
  id: 1,
  period_start: '2026-07-03',
  period_end: '2026-07-03',
  created_at: '2026-07-04T07:01:00Z',
  summary: 'NVIDIA slipped 1.4% as traders trimmed AI exposure ahead of supplier updates.',
  bullets: [],
  sources: [],
  price_change: null,
}

describe('FavouriteCard recap caption', () => {
  it('renders the daily recap summary when a recap is provided', () => {
    render(<FavouriteCard item={company} recap={recap} />)
    expect(screen.getByText(/NVIDIA slipped 1.4%/i)).toBeInTheDocument()
    expect(screen.getByText('Recap')).toBeInTheDocument()
  })

  it('does not render a recap caption when no recap is provided', () => {
    render(<FavouriteCard item={company} />)
    expect(screen.queryByText('Recap')).not.toBeInTheDocument()
  })

  it('shows a placeholder on the weekly tab and restores the daily summary', async () => {
    const user = userEvent.setup()
    render(<FavouriteCard item={company} recap={recap} />)

    await user.click(screen.getByRole('button', { name: /weekly recap/i }))
    expect(screen.getByText(/weekly recap coming soon/i)).toBeInTheDocument()
    expect(screen.queryByText(/NVIDIA slipped 1.4%/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /daily recap/i }))
    expect(screen.getByText(/NVIDIA slipped 1.4%/i)).toBeInTheDocument()
  })
})
