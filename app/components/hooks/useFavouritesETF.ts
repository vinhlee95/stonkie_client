'use client'
import { useState, useEffect, useCallback, useLayoutEffect } from 'react'
import { ETFListItem } from '@/app/components/ETFList'

const STORAGE_KEY = 'stonkie_favourites_etf'

export function useFavouritesETF() {
  const [favourites, setFavourites] = useState<ETFListItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize from localStorage on mount
  // Use useLayoutEffect to run synchronously before paint, preventing layout shift
  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ETFListItem[]
        setFavourites(parsed)
      }
    } catch (error) {
      console.error('Error loading ETF favourites from localStorage:', error)
    } finally {
      setIsInitialized(true)
    }
  }, [])

  // Save to localStorage whenever favourites change
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favourites))
      } catch (error) {
        console.error('Error saving ETF favourites to localStorage:', error)
      }
    }
  }, [favourites, isInitialized])

  const addFavourite = useCallback((etf: ETFListItem) => {
    setFavourites((prev) => {
      // Check if already exists
      if (prev.some((fav) => fav.ticker === etf.ticker)) {
        return prev
      }
      return [...prev, etf]
    })
  }, [])

  const removeFavourite = useCallback((ticker: string) => {
    setFavourites((prev) => prev.filter((fav) => fav.ticker !== ticker))
  }, [])

  const isFavourite = useCallback(
    (ticker: string) => {
      return favourites.some((fav) => fav.ticker === ticker)
    },
    [favourites],
  )

  const toggleFavourite = useCallback(
    (etf: ETFListItem) => {
      if (isFavourite(etf.ticker)) {
        removeFavourite(etf.ticker)
      } else {
        addFavourite(etf)
      }
    },
    [isFavourite, addFavourite, removeFavourite],
  )

  return {
    favourites,
    addFavourite,
    removeFavourite,
    isFavourite,
    toggleFavourite,
    isInitialized,
  }
}
