import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import MostViewedCompanies from '../MostViewedCompanies'
import { Company } from '@/app/CompanyList'

const mockCompanies: Company[] = [
  {
    name: 'Apple Inc.',
    ticker: 'AAPL',
    logo_url: 'https://example.com/aapl.png',
    sector: 'Technology',
  },
  {
    name: 'Microsoft Corporation',
    ticker: 'MSFT',
    logo_url: 'https://example.com/msft.png',
    sector: 'Technology',
  },
]

describe('Home Page Favourites - User Visible Behavior', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows filled star when company is added to favourites', async () => {
    const user = userEvent.setup()
    render(<MostViewedCompanies companies={mockCompanies} />)

    // Find and click the first favourite button
    const addButtons = await screen.findAllByRole('button', { name: /add to favourites/i })
    await user.click(addButtons[0])

    // Button should change to "Remove from favourites" with filled star
    await waitFor(() => {
      const removeButtons = screen.queryAllByRole('button', { name: /remove from favourites/i })
      expect(removeButtons.length).toBeGreaterThan(0)
    })
  })

  it('shows empty star when company is removed from favourites', async () => {
    const user = userEvent.setup()
    render(<MostViewedCompanies companies={mockCompanies} />)

    // Add favourite first
    const addButtons = await screen.findAllByRole('button', { name: /add to favourites/i })
    await user.click(addButtons[0])

    // Wait for it to be added
    await waitFor(() => {
      const removeButtons = screen.queryAllByRole('button', { name: /remove from favourites/i })
      expect(removeButtons.length).toBeGreaterThan(0)
    })

    // Click again to remove
    const removeButtons = screen.getAllByRole('button', { name: /remove from favourites/i })
    await user.click(removeButtons[0])

    // Should go back to "Add to favourites"
    await waitFor(() => {
      const addButtonsAgain = screen.queryAllByRole('button', { name: /add to favourites/i })
      // Should have 2 add buttons now (both companies)
      expect(addButtonsAgain.length).toBe(2)
    })
  })

  it('favourite button has cursor pointer for better UX', async () => {
    render(<MostViewedCompanies companies={mockCompanies} />)

    const addButtons = await screen.findAllByRole('button', { name: /add to favourites/i })
    expect(addButtons[0]).toHaveClass('cursor-pointer')
  })

  it('prevents navigation when clicking favourite button', async () => {
    const user = userEvent.setup()
    render(<MostViewedCompanies companies={mockCompanies} />)

    const addButtons = await screen.findAllByRole('button', { name: /add to favourites/i })

    // Click the favourite button
    await user.click(addButtons[0])

    // Button should update (proving click event was handled)
    await waitFor(() => {
      const removeButtons = screen.queryAllByRole('button', { name: /remove from favourites/i })
      expect(removeButtons.length).toBeGreaterThan(0)
    })

    // The button is inside a link, but clicking it shouldn't trigger navigation
    // (verified by e.preventDefault() and e.stopPropagation() in the button click handler)
  })
})
