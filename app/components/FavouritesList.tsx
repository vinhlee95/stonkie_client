'use client'

import { useFavourites } from './hooks/useFavourites'
import { useTickerRecaps } from './hooks/useTickerRecaps'
import { Company } from '@/app/CompanyList'
import { ETFListItem } from '@/app/components/ETFList'
import FavouriteCard from './FavouriteCard'

function FavouritesSkeleton() {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
      </div>
      <div className="hidden md:grid grid-cols-2 md:grid-cols-3 gap-3.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 animate-pulse"
            style={{ height: 180 }}
          />
        ))}
      </div>
      <div className="md:hidden flex gap-3 overflow-hidden">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 animate-pulse shrink-0"
            style={{ width: 260, height: 160 }}
          />
        ))}
      </div>
    </div>
  )
}

export default function FavouritesList() {
  const { favourites: companies, isInitialized: cInit } =
    useFavourites<Company>('stonkie_favourites')
  const { favourites: etfs, isInitialized: eInit } =
    useFavourites<ETFListItem>('stonkie_favourites_etf')

  // Precomputed daily recaps, keyed by uppercase ticker. ETFs have no recaps.
  const recaps = useTickerRecaps(companies.map((c) => c.ticker))

  if (!cInit || !eInit) return <FavouritesSkeleton />
  if (companies.length === 0 && etfs.length === 0) return null

  const items = [...companies, ...etfs]

  return (
    <section className="mb-4">
      {/* Section header */}
      <div className="flex items-baseline gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: 'var(--tab-active)',
              boxShadow: '0 0 0 4px rgba(40,105,86,0.16)',
            }}
          />
          <h2 className="text-xl font-bold tracking-tight m-0">Favourites</h2>
        </div>
        <span
          className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            color: 'var(--tab-active)',
            background: 'var(--accent-active-soft, rgba(40,105,86,0.08))',
          }}
        >
          {items.length} tracked
        </span>
      </div>

      {/* Desktop: grid */}
      <div className="hidden md:grid grid-cols-2 md:grid-cols-3 items-start gap-3.5">
        {items.map((it) => (
          <FavouriteCard
            key={it.ticker}
            item={it}
            variant="grid"
            recap={recaps[it.ticker.toUpperCase()]}
          />
        ))}
      </div>

      {/* Mobile: horizontal scroll-snap rail */}
      <div className="md:hidden flex items-start gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-2 px-2 pb-1">
        {items.map((it) => (
          <FavouriteCard
            key={it.ticker}
            item={it}
            variant="rail"
            recap={recaps[it.ticker.toUpperCase()]}
          />
        ))}
      </div>
    </section>
  )
}
