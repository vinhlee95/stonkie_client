'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Company } from '../CompanyList'

interface SearchResult {
  symbol: string
  name: string
  logo_url?: string
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
  companies: Company[] | null
}

const CompanySearch: React.FC<CompanySearchProps> = ({
  ticker,
  onTickerChange,
  onSubmit,
  companies,
}) => {
  const router = useRouter()
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [inputValue, setInputValue] = useState(ticker)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])

  // Search local companies by ticker or name (case-insensitive)
  const searchLocalCompanies = (query: string): SearchResult[] => {
    if (!companies || companies.length === 0) return []

    const lowerQuery = query.toLowerCase()
    const matches = companies.filter(
      (company) =>
        company.ticker.toLowerCase().includes(lowerQuery) ||
        company.name.toLowerCase().includes(lowerQuery),
    )

    return matches.map((company) => ({
      symbol: company.ticker,
      name: company.name,
      logo_url: company.logo_url,
    }))
  }

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

    // If input is empty, clear results and hide dropdown
    if (!value.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      // Cancel any pending API call
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      return
    }

    // Search local companies first (instant, no debounce)
    const localResults = searchLocalCompanies(value)

    if (localResults.length > 0) {
      // Found local results - show them immediately
      setSearchResults(localResults)
      setShowDropdown(true)
      // Cancel any pending API call since we have local results
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    } else {
      // No local results - trigger debounced API search
      debouncedSearch(value)
    }
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
              className="w-full px-4 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-xl 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder:text-gray-400 dark:placeholder:text-gray-500"
              onFocus={() => {
                // Show top 10 companies when input is empty and focused
                if (!inputValue.trim() && companies && companies.length > 0) {
                  const top10 = companies.slice(0, 10).map((company) => ({
                    symbol: company.ticker,
                    name: company.name,
                    logo_url: company.logo_url,
                  }))
                  setSearchResults(top10)
                  setShowDropdown(true)
                } else if (searchResults.length > 0) {
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
                            rounded-xl shadow-lg max-h-100 overflow-y-auto"
              >
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    ref={(el) => {
                      optionRefs.current[index] = el
                    }}
                    onClick={() => handleSelectOption(result)}
                    className={`px-4 py-3 cursor-pointer flex items-center gap-3
                             text-gray-900 dark:text-gray-100 text-sm
                             first:rounded-t-xl last:rounded-b-xl
                             transition-colors duration-150
                             ${
                               index === selectedIndex
                                 ? 'bg-blue-100 dark:bg-blue-900'
                                 : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                             }`}
                  >
                    {/* Company logo or placeholder */}
                    <div className="w-8 h-8 flex-shrink-0 relative">
                      <img
                        src={result.logo_url || '/stonkie.png'}
                        alt={`${result.name} logo`}
                        className="w-full h-full object-contain rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/stonkie.png'
                        }}
                      />
                    </div>
                    {/* Company info */}
                    <div className="flex-1 min-w-0">
                      <div>
                        <span className="font-semibold">{result.symbol}</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{result.name}</span>
                      </div>
                    </div>
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
