'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  symbol: string
  name: string
}

interface FinnhubMatch {
  description: string
  displaySymbol: string
  symbol: string
  type: string
}

interface CompanySearchProps {
  ticker: string
  onTickerChange: (ticker: string) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
}

const CompanySearch: React.FC<CompanySearchProps> = ({ ticker, onTickerChange, onSubmit }) => {
  const router = useRouter()
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [inputValue, setInputValue] = useState(ticker)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchSymbols = async (query: string) => {
    if (!query || query.length < 1) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    setSearchLoading(true)
    try {
      // TODO: move this to server side
      const response = await fetch(
        `https://finnhub.io/api/v1/search?q=${query}&exchange=US&token=${process.env.NEXT_PUBLIC_FINNHUB_API_KEY}`,
      )
      const data = await response.json()

      if (data.result) {
        // Filter to only Common Stock type
        const results = data.result
          .filter(
            (match: FinnhubMatch) => match.type === 'Common Stock' && !match.symbol.includes('.'), // Exclude non-US exchanges
          )
          .map((match: FinnhubMatch) => ({
            symbol: match.symbol,
            name: match.description,
          }))
        setSearchResults(results)
        setShowDropdown(results.length > 0)
      }
    } catch (err) {
      console.error('Failed to fetch symbols:', err)
    } finally {
      setSearchLoading(false)
    }
  }

  // Debounce with 2 seconds delay to avoid hitting API rate limits
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const debouncedSearch = (query: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    debounceTimeoutRef.current = setTimeout(() => {
      searchSymbols(query)
    }, 2000) // 2 second debounce
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    onTickerChange(value)
    setSelectedIndex(-1) // Reset selection when typing
    debouncedSearch(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || searchResults.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSelectOption(searchResults[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSelectOption = (option: SearchResult) => {
    router.push(`/tickers/${option.symbol.toUpperCase()}`)
  }

  return (
    <div className="flex items-center mb-8 gap-4 w-full">
      <form onSubmit={onSubmit} className="flex-grow">
        <div className="flex gap-4">
          <div className="relative flex-grow" ref={dropdownRef}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter stock ticker or company name (e.g. AAPL or Apple). Only US tickers are supported now."
              className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder:text-gray-400 dark:placeholder:text-gray-500"
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowDropdown(true)
                }
              }}
            />

            {/* Loading spinner */}
            {searchLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* Dropdown results */}
            {showDropdown && searchResults.length > 0 && (
              <div
                className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                            rounded-xl shadow-lg max-h-60 overflow-y-auto"
              >
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    ref={(el) => {
                      optionRefs.current[index] = el
                    }}
                    onClick={() => handleSelectOption(result)}
                    className={`px-4 py-2 cursor-pointer 
                             text-gray-900 dark:text-gray-100 text-sm
                             first:rounded-t-xl last:rounded-b-xl
                             transition-colors duration-150
                             ${
                               index === selectedIndex
                                 ? 'bg-blue-100 dark:bg-blue-900'
                                 : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                             }`}
                  >
                    <span className="font-semibold">{result.symbol}</span> - {result.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

export default CompanySearch
