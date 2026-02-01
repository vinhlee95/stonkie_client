import { render, screen, waitFor } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import ETFFavouriteButton from '../ETFFavouriteButton'

const mockETF = {
  ticker: 'SPY',
  name: 'SPDR S&P 500 ETF Trust',
  fund_provider: 'State Street',
}

describe('ETFFavouriteButton', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders unfilled star when not in favourites', async () => {
    render(<ETFFavouriteButton etf={mockETF} />)

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /add to favourites/i })
      expect(button).toBeInTheDocument()
    })
  })

  it('toggles favourite state on click', async () => {
    const user = userEvent.setup()
    render(<ETFFavouriteButton etf={mockETF} />)

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    const button = screen.getByRole('button', { name: /add to favourites/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /remove from favourites/i })).toBeInTheDocument()
    })

    expect(localStorage.setItem).toHaveBeenCalled()
  })
})
