import { renderHook, act, waitFor } from '@testing-library/react'
import { useFavourites } from '../useFavourites'

const mockCompany = {
  ticker: 'AAPL',
  name: 'Apple Inc.',
  logo_url: '',
  sector: 'Technology',
}

describe('useFavourites', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initializes with empty favourites', async () => {
    const { result } = renderHook(() => useFavourites())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    expect(result.current.favourites).toEqual([])
  })

  it('adds a favourite', async () => {
    const { result } = renderHook(() => useFavourites())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    act(() => {
      result.current.addFavourite(mockCompany)
    })

    expect(result.current.favourites).toHaveLength(1)
    expect(result.current.isFavourite('AAPL')).toBe(true)
  })

  it('removes a favourite', async () => {
    const { result } = renderHook(() => useFavourites())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    act(() => {
      result.current.addFavourite(mockCompany)
    })

    act(() => {
      result.current.removeFavourite('AAPL')
    })

    expect(result.current.favourites).toHaveLength(0)
    expect(result.current.isFavourite('AAPL')).toBe(false)
  })

  it('prevents duplicate favourites', async () => {
    const { result } = renderHook(() => useFavourites())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    act(() => {
      result.current.addFavourite(mockCompany)
      result.current.addFavourite(mockCompany)
    })

    expect(result.current.favourites).toHaveLength(1)
  })

  it('persists to localStorage', async () => {
    const { result } = renderHook(() => useFavourites())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    act(() => {
      result.current.addFavourite(mockCompany)
    })

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'stonkie_favourites',
        JSON.stringify([mockCompany]),
      )
    })
  })
})
