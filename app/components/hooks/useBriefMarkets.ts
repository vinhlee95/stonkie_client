import { useMemo } from 'react'
import { matchesMarket, MARKETS, type MarketDef } from '../MarketFilter'
import { FRONTEND_TO_BACKEND_MARKET, type FrontendMarketRecapKey } from '@/lib/api/marketRecap'
import type { Company } from '@/app/CompanyList'

const INDEX_LABELS: Record<string, string> = {
  USA: 'S&P 500',
  Finland: 'OMXH25',
  Vietnam: 'VN-Index',
}

/** Markets eligible for the brief (excludes 'all' and 'etf'). */
const BRIEF_MARKET_KEYS: FrontendMarketRecapKey[] = ['USA', 'Finland', 'Vietnam']

export interface BriefMarket {
  key: string
  label: string
  flag: string
  backendCode: string
  indexLabel: string
  favouriteCount: number
}

export interface BriefMarketsResult {
  primary: BriefMarket
  secondaries: BriefMarket[]
}

/**
 * Pure function: given favourites, returns primary + secondaries for the brief.
 * All 3 markets always included. Primary picked by favCount → locale → US fallback.
 */
export function pickBriefMarkets(favourites: Company[], locale?: string): BriefMarketsResult {
  const counts = new Map<string, number>()
  for (const key of BRIEF_MARKET_KEYS) counts.set(key, 0)

  for (const fav of favourites) {
    for (const key of BRIEF_MARKET_KEYS) {
      if (matchesMarket(key, fav.country)) {
        counts.set(key, (counts.get(key) ?? 0) + 1)
        break
      }
    }
  }

  const toBriefMarket = (key: FrontendMarketRecapKey): BriefMarket => {
    const def = MARKETS.find((m) => m.key === key) as MarketDef
    return {
      key,
      label: def.label,
      flag: def.flag,
      backendCode: FRONTEND_TO_BACKEND_MARKET[key],
      indexLabel: INDEX_LABELS[key] ?? key,
      favouriteCount: counts.get(key) ?? 0,
    }
  }

  const all = BRIEF_MARKET_KEYS.map(toBriefMarket)

  // Sort by favCount desc for ranking
  const sorted = [...all].sort((a, b) => b.favouriteCount - a.favouriteCount)

  // Find the top count
  const topCount = sorted[0].favouriteCount
  const tied = sorted.filter((m) => m.favouriteCount === topCount)

  let primary: BriefMarket

  if (tied.length === 1) {
    primary = tied[0]
  } else {
    // Tie-break by locale
    const lang = locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'en-US')
    const countryCode = lang.split('-').pop()?.toUpperCase() ?? ''

    const localeMatch = tied.find((m) => {
      // Match against backend code (US, FI, VN) and market aliases
      if (m.backendCode === countryCode) return true
      const def = MARKETS.find((d) => d.key === m.key)
      return def?.aliases?.some((a) => a.toUpperCase() === countryCode)
    })

    primary = localeMatch ?? tied.find((m) => m.key === 'USA') ?? tied[0]
  }

  const secondaries = sorted.filter((m) => m.key !== primary.key)

  return { primary, secondaries }
}

/** React hook wrapping pickBriefMarkets with memoisation. */
export function useBriefMarkets(favourites: Company[]): BriefMarketsResult {
  return useMemo(() => pickBriefMarkets(favourites), [favourites])
}
