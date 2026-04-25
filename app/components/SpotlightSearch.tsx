'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SearchOutlined } from '@mui/icons-material'
import { usePopularCompanies } from './hooks/usePopularCompanies'

interface SearchResult {
  symbol: string
  name: string
  logo_url?: string
}

interface SpotlightSearchProps {
  onClose: () => void
}

const SpotlightSearch: React.FC<SpotlightSearchProps> = ({ onClose }) => {
  const router = useRouter()
  const [inputValue, setInputValue] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isVisible, setIsVisible] = useState(false)

  const { data: popularCompanies } = usePopularCompanies()

  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Show popular companies when data loads and input is empty
  useEffect(() => {
    if (popularCompanies && !inputValue.trim()) {
      setSearchResults(
        popularCompanies.map((c) => ({
          symbol: c.ticker,
          name: c.name,
          logo_url: c.logo_url,
        })),
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popularCompanies])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
    }
  }, [])

  const searchLocalCompanies = useCallback(
    (query: string): SearchResult[] => {
      if (!popularCompanies || popularCompanies.length === 0) return []
      const lowerQuery = query.toLowerCase()
      return popularCompanies
        .filter(
          (c) =>
            c.ticker.toLowerCase().includes(lowerQuery) ||
            c.name.toLowerCase().includes(lowerQuery),
        )
        .map((c) => ({
          symbol: c.ticker,
          name: c.name,
          logo_url: c.logo_url,
        }))
    },
    [popularCompanies],
  )

  const searchSymbols = async (query: string) => {
    if (!query || query.length < 1) return
    setSearchLoading(true)
    try {
      const params = new URLSearchParams({ q: query })
      const response = await fetch(`/api/tickers?${params}`)
      if (!response.ok) throw new Error(`Search failed: ${response.status}`)
      const results: SearchResult[] = await response.json()
      setSearchResults(results)
    } catch (err) {
      console.error('Failed to fetch symbols:', err)
    } finally {
      setSearchLoading(false)
    }
  }

  const debouncedSearch = (query: string) => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
    debounceTimeoutRef.current = setTimeout(() => searchSymbols(query), 2000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setSelectedIndex(-1)

    if (!value.trim()) {
      // Show popular companies when input is cleared
      if (popularCompanies && popularCompanies.length > 0) {
        setSearchResults(
          popularCompanies.map((c) => ({
            symbol: c.ticker,
            name: c.name,
            logo_url: c.logo_url,
          })),
        )
      } else {
        setSearchResults([])
      }
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
      return
    }

    const localResults = searchLocalCompanies(value)
    if (localResults.length > 0) {
      setSearchResults(localResults)
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
    } else {
      setSearchResults([])
      debouncedSearch(value)
    }
  }

  const handleSelectOption = (option: SearchResult) => {
    router.push(`/tickers/${option.symbol.toUpperCase()}`)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
        } else if (searchResults.length > 0) {
          handleSelectOption(searchResults[0])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  // Scroll selected option into view
  useEffect(() => {
    if (selectedIndex >= 0 && optionRefs.current[selectedIndex]) {
      optionRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        data-testid="spotlight-backdrop"
      />

      {/* Search panel */}
      <div
        className={`relative z-10 mx-auto mt-[15vh] sm:mt-[25vh] w-[92vw] max-w-xl pb-8 transition-all duration-200 ease-out ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        ref={panelRef}
      >
        <div className="flex flex-col max-h-[60vh] sm:max-h-[70vh] rounded-2xl bg-white/80 dark:bg-[#1C1C1C]/80 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.16)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] border border-white/30 dark:border-white/10 overflow-hidden">
          {/* Input row */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <SearchOutlined className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Search ticker or company..."
              className="flex-1 bg-transparent text-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none"
            />
            {searchLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 flex-shrink-0" />
            )}
          </div>

          {/* Results */}
          {searchResults.length > 0 && (
            <div className="modal-content min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {searchResults.map((result, index) => (
                <div
                  key={`${result.symbol}-${index}`}
                  ref={(el) => {
                    optionRefs.current[index] = el
                  }}
                  onClick={() => handleSelectOption(result)}
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={`px-5 py-3 cursor-pointer flex items-center gap-3
                    text-gray-900 dark:text-gray-100 text-sm
                    transition-colors duration-100
                    ${
                      index === selectedIndex
                        ? 'bg-blue-500/10 dark:bg-blue-400/15'
                        : 'hover:bg-gray-500/10 dark:hover:bg-gray-400/10'
                    }`}
                >
                  <div className="w-8 h-8 flex-shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold">{result.symbol}</span>
                    <span className="ml-2 text-gray-500 dark:text-gray-400">{result.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state hint */}
          {searchResults.length === 0 && inputValue.trim() && !searchLoading && (
            <div className="px-5 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
              No results found
            </div>
          )}

          {/* Keyboard hint */}
          <div className="px-5 py-2 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-200/60 dark:bg-gray-700/60 font-mono text-[10px]">
                ↑↓
              </kbd>{' '}
              navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-200/60 dark:bg-gray-700/60 font-mono text-[10px]">
                ↵
              </kbd>{' '}
              select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-200/60 dark:bg-gray-700/60 font-mono text-[10px]">
                esc
              </kbd>{' '}
              close
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpotlightSearch
