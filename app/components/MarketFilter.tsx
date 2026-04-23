'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Company } from '@/app/CompanyList'

export type MarketDef = {
  key: string
  label: string
  flag: string
  fullName?: string
  exchange?: string
  /** Country values from the backend that belong to this market (case-insensitive). */
  aliases?: readonly string[]
}

export const ALL_MARKETS_KEY = 'all'
export const ETF_MARKET_KEY = 'etf'

export const MARKETS: readonly MarketDef[] = [
  { key: ALL_MARKETS_KEY, label: 'All', flag: '🌍' },
  {
    key: 'USA',
    label: 'US',
    flag: '🇺🇸',
    fullName: 'United States',
    exchange: 'NYSE / NASDAQ',
    aliases: ['USA', 'United States', 'US'],
  },
  {
    key: 'Finland',
    label: 'Finland',
    flag: '🇫🇮',
    fullName: 'Finland',
    exchange: 'OMX Helsinki',
    aliases: ['Finland'],
  },
  {
    key: 'Vietnam',
    label: 'Vietnam',
    flag: '🇻🇳',
    fullName: 'Vietnam',
    exchange: 'HOSE / HNX',
    aliases: ['Vietnam', 'Viet Nam'],
  },
  { key: ETF_MARKET_KEY, label: 'ETFs', flag: '💼' },
] as const

export function matchesMarket(marketKey: string, country: string): boolean {
  if (marketKey === ALL_MARKETS_KEY) return true
  if (marketKey === ETF_MARKET_KEY) return false
  const def = MARKETS.find((m) => m.key === marketKey)
  if (!def?.aliases) return false
  const normalized = country.trim().toLowerCase()
  return def.aliases.some((a) => a.toLowerCase() === normalized)
}

export function getMarketDef(key: string): MarketDef | undefined {
  return MARKETS.find((m) => m.key === key)
}

export interface MarketFilterProps {
  companies: Company[]
  activeMarket: string
  onSelect: (key: string) => void
  etfCount?: number
}

export default function MarketFilter({
  companies,
  activeMarket,
  onSelect,
  etfCount = 0,
}: MarketFilterProps) {
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const m of MARKETS) {
      if (m.key === ALL_MARKETS_KEY) continue
      if (m.key === ETF_MARKET_KEY) {
        map.set(m.key, etfCount)
        continue
      }
      let n = 0
      for (const c of companies) {
        if (matchesMarket(m.key, c.country)) n++
      }
      map.set(m.key, n)
    }
    return map
  }, [companies, etfCount])

  const visibleMarkets = useMemo(
    () =>
      MARKETS.filter((m) => {
        if (m.key === ALL_MARKETS_KEY) return true
        return (counts.get(m.key) ?? 0) > 0
      }),
    [counts],
  )

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const activeIndex = visibleMarkets.findIndex((m) => m.key === activeMarket)
    const el = tabRefs.current[activeIndex]
    if (el) {
      setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth })
    }
  }, [activeMarket, visibleMarkets])

  return (
    <div className="relative py-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mb-1">
      <div
        className="relative flex bg-gray-100/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-full p-1.5 gap-1 w-fit"
        role="tablist"
        aria-label="Market filter"
      >
        <div
          className="absolute top-1.5 bottom-1.5 rounded-full bg-white dark:bg-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />

        {visibleMarkets.map((market, index) => {
          const isActive = activeMarket === market.key
          const count =
            market.key === ALL_MARKETS_KEY ? companies.length : (counts.get(market.key) ?? 0)

          return (
            <button
              key={market.key}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(market.key)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-base font-medium transition-all duration-300 z-10 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span className="text-[15px] leading-none">{market.flag}</span>
              <span>{market.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                  isActive
                    ? 'bg-[var(--accent-active)] dark:bg-[var(--accent-active-dark)] text-white dark:text-[#1a1a1a]'
                    : 'bg-black/[0.08] dark:bg-white/15 text-inherit'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
