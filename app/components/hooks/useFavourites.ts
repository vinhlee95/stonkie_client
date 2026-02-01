'use client'
import { useState, useEffect, useCallback, useLayoutEffect } from 'react'

// Generic type constraint: items must have a ticker property
type TickerItem = {
  ticker: string
}

export function useFavourites<T extends TickerItem>(storageKey: string) {
  const [favourites, setFavourites] = useState<T[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize from localStorage on mount
  // Use useLayoutEffect to run synchronously before paint, preventing layout shift
  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as T[]
        setFavourites(parsed)
      }
    } catch (error) {
      console.error('Error loading favourites from localStorage:', error)
    } finally {
      setIsInitialized(true)
    }
  }, [storageKey])

  // Save to localStorage whenever favourites change
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(favourites))
      } catch (error) {
        console.error('Error saving favourites to localStorage:', error)
      }
    }
  }, [favourites, isInitialized, storageKey])

  const addFavourite = useCallback((item: T) => {
    setFavourites((prev) => {
      // Check if already exists
      if (prev.some((fav) => fav.ticker === item.ticker)) {
        return prev
      }
      return [...prev, item]
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
    (item: T) => {
      if (isFavourite(item.ticker)) {
        removeFavourite(item.ticker)
      } else {
        addFavourite(item)
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
