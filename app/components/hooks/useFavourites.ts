'use client'
import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react'

// Generic type constraint: items must have a ticker property
type TickerItem = {
  ticker: string
}

// Custom event for syncing favourites across components
const FAVOURITES_CHANGED_EVENT = 'favouritesChanged'

export function useFavourites<T extends TickerItem>(storageKey: string) {
  const [favourites, setFavourites] = useState<T[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const isUpdatingRef = useRef(false)

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

  // Listen for favourites changes from other components
  useEffect(() => {
    const handleFavouritesChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ storageKey: string }>
      if (customEvent.detail.storageKey === storageKey && !isUpdatingRef.current) {
        try {
          const stored = localStorage.getItem(storageKey)
          const newData = stored ? (JSON.parse(stored) as T[]) : []

          // Only update if data actually changed
          setFavourites((prev) => {
            const hasChanged =
              prev.length !== newData.length ||
              prev.some((item, idx) => item.ticker !== newData[idx]?.ticker)
            return hasChanged ? newData : prev
          })
        } catch (error) {
          console.error('Error syncing favourites:', error)
        }
      }
    }

    window.addEventListener(FAVOURITES_CHANGED_EVENT, handleFavouritesChanged)
    return () => {
      window.removeEventListener(FAVOURITES_CHANGED_EVENT, handleFavouritesChanged)
    }
  }, [storageKey])

  // Save to localStorage whenever favourites change
  useEffect(() => {
    if (isInitialized) {
      try {
        isUpdatingRef.current = true
        localStorage.setItem(storageKey, JSON.stringify(favourites))
        // Notify other components about the change
        window.dispatchEvent(
          new CustomEvent(FAVOURITES_CHANGED_EVENT, {
            detail: { storageKey },
          }),
        )
        // Reset flag after a short delay to allow event to propagate
        setTimeout(() => {
          isUpdatingRef.current = false
        }, 0)
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
