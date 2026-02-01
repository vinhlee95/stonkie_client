import { render, screen, waitFor } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import FavouriteButton from '../FavouriteButton'

const mockCompany = {
  ticker: 'AAPL',
  name: 'Apple Inc.',
  logo_url: '',
  sector: 'Technology',
}

describe('FavouriteButton', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders unfilled star when not in favourites', async () => {
    render(<FavouriteButton company={mockCompany} />)

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /add to favourites/i })
      expect(button).toBeInTheDocument()
    })
  })

  it('toggles favourite state on click', async () => {
    const user = userEvent.setup()
    render(<FavouriteButton company={mockCompany} />)

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
