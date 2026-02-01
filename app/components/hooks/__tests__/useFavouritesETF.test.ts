import { renderHook, act, waitFor } from '@testing-library/react'
import { useFavourites } from '../useFavourites'
import { ETFListItem } from '@/app/components/ETFList'

const mockETF: ETFListItem = {
  ticker: 'SPY',
  name: 'SPDR S&P 500 ETF Trust',
  fund_provider: 'State Street',
}

describe('useFavourites with ETF type', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initializes with empty favourites', async () => {
    const { result } = renderHook(() => useFavourites<ETFListItem>('stonkie_favourites_etf'))

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    expect(result.current.favourites).toEqual([])
  })

  it('adds a favourite', async () => {
    const { result } = renderHook(() => useFavourites<ETFListItem>('stonkie_favourites_etf'))

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    act(() => {
      result.current.addFavourite(mockETF)
    })

    expect(result.current.favourites).toHaveLength(1)
    expect(result.current.isFavourite('SPY')).toBe(true)
  })

  it('removes a favourite', async () => {
    const { result } = renderHook(() => useFavourites<ETFListItem>('stonkie_favourites_etf'))

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    act(() => {
      result.current.addFavourite(mockETF)
    })

    act(() => {
      result.current.removeFavourite('SPY')
    })

    expect(result.current.favourites).toHaveLength(0)
    expect(result.current.isFavourite('SPY')).toBe(false)
  })

  it('prevents duplicate favourites', async () => {
    const { result } = renderHook(() => useFavourites<ETFListItem>('stonkie_favourites_etf'))

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    act(() => {
      result.current.addFavourite(mockETF)
      result.current.addFavourite(mockETF)
    })

    expect(result.current.favourites).toHaveLength(1)
  })

  it('persists to localStorage', async () => {
    const { result } = renderHook(() => useFavourites<ETFListItem>('stonkie_favourites_etf'))

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    act(() => {
      result.current.addFavourite(mockETF)
    })

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'stonkie_favourites_etf',
        JSON.stringify([mockETF]),
      )
    })
  })
})
