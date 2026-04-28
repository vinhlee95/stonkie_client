'use client'

import { Company } from '@/app/CompanyList'
import MarketChart from '@/app/MarketChart'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ETFList, { ETFListItem } from './ETFList'
import IndexSummaryStrip from './IndexSummaryStrip'
import MarketRecapIsland from './MarketRecapIsland'
import MarketFilter, {
  ALL_MARKETS_KEY,
  ETF_MARKET_KEY,
  getMarketDef,
  matchesMarket,
} from './MarketFilter'
import { FRONTEND_TO_BACKEND_MARKET, FrontendMarketRecapKey } from '@/lib/api/marketRecap'
import ScrollToTopButton from './ScrollToTopButton'
import SectorFilter, { SectorNavItem } from './SectorFilter'
import SectorSection from './SectorSection'

/** Sentinel for "scroll to top / all sectors" */
export const ALL_SECTORS_KEY = 'all'

export function normalizeSectorKey(sector: string): string {
  return sector.trim().toLowerCase()
}

export type SectorGroup = {
  key: string
  label: string
  companies: Company[]
}

/** Stable DOM id for anchor links / scroll targets */
export function sectorDomId(key: string): string {
  return `sector-${key.replace(/\s+/g, '-')}`
}

const OTHER_KEY = 'other'

export function groupCompaniesBySector(companies: Company[]): SectorGroup[] {
  const map = new Map<string, { label: string; companies: Company[] }>()
  const order: string[] = []

  for (const company of companies) {
    const raw = company.sector?.trim()
    const key = raw ? normalizeSectorKey(raw) : OTHER_KEY
    const label = raw || 'Other'

    if (!map.has(key)) {
      map.set(key, { label, companies: [] })
      order.push(key)
    }
    map.get(key)!.companies.push(company)
  }

  const groups = order.map((key) => {
    const entry = map.get(key)!
    return { key, label: entry.label, companies: entry.companies }
  })

  groups.sort((a, b) => {
    const diff = b.companies.length - a.companies.length
    if (diff !== 0) return diff
    return order.indexOf(a.key) - order.indexOf(b.key)
  })

  return groups
}

const SCROLL_SPY_ROOT_MARGIN = '-88px 0px -50% 0px'

export default function MostViewedCompanies({
  companies,
  etfs = [],
}: {
  companies: Company[]
  etfs?: ETFListItem[]
}) {
  const topRef = useRef<HTMLDivElement>(null)
  const sectionElementsRef = useRef<Record<string, HTMLElement | null>>({})
  const ignoreScrollSpyRef = useRef(false)
  const scrollSpyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const visibleSectionsRef = useRef<Set<string>>(new Set())

  const [market, setMarket] = useState<string>(ALL_MARKETS_KEY)

  const marketPool = useMemo(
    () =>
      market === ALL_MARKETS_KEY
        ? companies
        : companies.filter((c) => matchesMarket(market, c.country)),
    [companies, market],
  )

  const groups = useMemo(() => groupCompaniesBySector(marketPool), [marketPool])

  const navItems: SectorNavItem[] = useMemo(
    () => [
      { key: ALL_SECTORS_KEY, label: 'All Sectors' },
      ...groups.map((g) => ({ key: g.key, label: g.label })),
    ],
    [groups],
  )

  const [activeKey, setActiveKey] = useState<string>(ALL_SECTORS_KEY)

  const handleMarket = useCallback((key: string) => {
    setMarket(key)
    setActiveKey(ALL_SECTORS_KEY)
  }, [])

  const isEtfMarket = market === ETF_MARKET_KEY
  const activeMarketDef =
    market === ALL_MARKETS_KEY || isEtfMarket ? undefined : getMarketDef(market)
  const recapIslandMarketKey = useMemo((): FrontendMarketRecapKey | null => {
    if (!activeMarketDef) return null
    const k = activeMarketDef.key
    if (k in FRONTEND_TO_BACKEND_MARKET) return k as FrontendMarketRecapKey
    return null
  }, [activeMarketDef])

  const setSectionRef = useCallback((key: string) => {
    return (el: HTMLElement | null) => {
      sectionElementsRef.current[key] = el
    }
  }, [])

  const navigateToSector = useCallback((key: string) => {
    if (scrollSpyTimeoutRef.current) {
      clearTimeout(scrollSpyTimeoutRef.current)
    }
    ignoreScrollSpyRef.current = true
    setActiveKey(key)

    if (key === ALL_SECTORS_KEY) {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      const el = document.getElementById(sectorDomId(key))
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    scrollSpyTimeoutRef.current = setTimeout(() => {
      ignoreScrollSpyRef.current = false
      scrollSpyTimeoutRef.current = null
    }, 800)
  }, [])

  useEffect(() => {
    return () => {
      if (scrollSpyTimeoutRef.current) {
        clearTimeout(scrollSpyTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (groups.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (ignoreScrollSpyRef.current) return

        // Update the set of currently visible sections
        for (const e of entries) {
          const key = (e.target as HTMLElement).dataset?.sectorKey
          if (!key) continue
          if (e.isIntersecting) {
            visibleSectionsRef.current.add(key)
          } else {
            visibleSectionsRef.current.delete(key)
          }
        }

        if (visibleSectionsRef.current.size === 0) {
          setActiveKey(ALL_SECTORS_KEY)
          return
        }

        // Pick the visible section closest to the sticky nav
        const candidates = [...visibleSectionsRef.current]
          .map((key) => {
            const el = sectionElementsRef.current[key]
            if (!el) return null
            const top = el.getBoundingClientRect().top
            return { key, top }
          })
          .filter((x): x is { key: string; top: number } => x !== null)

        if (candidates.length === 0) return

        candidates.sort((a, b) => {
          const da = Math.abs(a.top - 88)
          const db = Math.abs(b.top - 88)
          if (da !== db) return da - db
          return 0
        })

        setActiveKey(candidates[0]!.key)
      },
      {
        root: null,
        rootMargin: SCROLL_SPY_ROOT_MARGIN,
        threshold: [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.75, 1],
      },
    )

    for (const g of groups) {
      const el = sectionElementsRef.current[g.key]
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [groups])

  return (
    <div ref={topRef} id="most-viewed-companies-top" className="scroll-mt-0">
      <div className="sticky top-0 z-20 -mx-4 px-4 sm:mx-0 sm:px-0 mb-4 pt-1 pb-2 bg-[var(--background)] border-b border-gray-200/80 dark:border-gray-700/80">
        <MarketFilter
          companies={companies}
          activeMarket={market}
          onSelect={handleMarket}
          etfCount={etfs.length}
        />
        {!isEtfMarket && (
          <SectorFilter
            items={navItems}
            activeKey={activeKey}
            onNavigate={navigateToSector}
            embedded
          />
        )}
      </div>

      {market === ALL_MARKETS_KEY && (
        <div className="mb-4">
          <IndexSummaryStrip />
        </div>
      )}

      {activeMarketDef && (market === 'USA' || market === 'Finland') && (
        <div className="mb-4">
          <MarketChart market={market} height={market === 'USA' ? 300 : 240} />
        </div>
      )}
      {recapIslandMarketKey && (
        <div className="mb-4">
          <MarketRecapIsland marketKey={recapIslandMarketKey} />
        </div>
      )}

      <ScrollToTopButton onScrollToTop={() => navigateToSector(ALL_SECTORS_KEY)} />

      {isEtfMarket ? (
        <div key={market} className="animate-[market-fade-in_200ms_ease-out_both]">
          <ETFList etfs={etfs} />
        </div>
      ) : (
        <div key={market} className="space-y-10">
          {groups.map((group, groupIndex) => (
            <section
              key={group.key}
              id={sectorDomId(group.key)}
              ref={setSectionRef(group.key)}
              data-sector-key={group.key}
              className="scroll-mt-24 animate-[market-fade-in_200ms_ease-out_both]"
              aria-labelledby={`heading-${sectorDomId(group.key)}`}
              style={{ animationDelay: `${Math.min(groupIndex * 25, 150)}ms` }}
            >
              <h2
                id={`heading-${sectorDomId(group.key)}`}
                className="text-lg font-semibold text-gray-800 dark:text-white mb-4"
              >
                {group.label}
              </h2>
              <SectorSection companies={group.companies} />
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
