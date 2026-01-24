'use client'
import { useState, useEffect, useCallback, useLayoutEffect } from 'react'
import { Company } from '@/app/CompanyList'

const STORAGE_KEY = 'stonkie_favourites'

export function useFavourites() {
  const [favourites, setFavourites] = useState<Company[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize from localStorage on mount
  // Use useLayoutEffect to run synchronously before paint, preventing layout shift
  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Company[]
        setFavourites(parsed)
      }
    } catch (error) {
      console.error('Error loading favourites from localStorage:', error)
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
        console.error('Error saving favourites to localStorage:', error)
      }
    }
  }, [favourites, isInitialized])

  const addFavourite = useCallback((company: Company) => {
    setFavourites((prev) => {
      // Check if already exists
      if (prev.some((fav) => fav.ticker === company.ticker)) {
        return prev
      }
      return [...prev, company]
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
    (company: Company) => {
      if (isFavourite(company.ticker)) {
        removeFavourite(company.ticker)
      } else {
        addFavourite(company)
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
