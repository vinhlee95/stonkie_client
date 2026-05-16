'use client'

import Link from 'next/link'
import { Star } from 'lucide-react'
import { Company } from '@/app/CompanyList'
import { ETFListItem } from '@/app/components/ETFList'
import { useFavourites } from './hooks/useFavourites'
import TradingViewMiniChart from './TradingViewMiniChart'

type FavouriteItem = Company | ETFListItem

function isETF(item: FavouriteItem): item is ETFListItem {
  return 'fund_provider' in item
}

function getItemLink(item: FavouriteItem): string {
  return isETF(item) ? `/etf/${item.ticker}` : `/tickers/${item.ticker}`
}

function FavStar({ item }: { item: FavouriteItem }) {
  const etf = isETF(item)
  const { isFavourite, toggleFavourite, isInitialized } = useFavourites<FavouriteItem>(
    etf ? 'stonkie_favourites_etf' : 'stonkie_favourites',
  )
  const isFav = isFavourite(item.ticker)

  if (!isInitialized) return null

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFavourite(item)
      }}
      className="p-1 transition-colors cursor-pointer"
      aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
    >
      <Star
        className={`w-4 h-4 transition-colors ${
          isFav
            ? 'fill-[var(--tab-active)] text-[var(--tab-active)] dark:fill-[var(--accent-active-dark)] dark:text-[var(--accent-active-dark)]'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    </button>
  )
}

export interface FavouriteCardProps {
  item: FavouriteItem
  variant?: 'grid' | 'rail'
  earningsInDays?: number
  headline?: string
}

export default function FavouriteCard({
  item,
  variant = 'grid',
  earningsInDays,
  headline,
}: FavouriteCardProps) {
  const hasEarnings = earningsInDays != null && earningsInDays <= 60
  const hasNews = !!headline
  const hasFooter = hasEarnings || hasNews
  const itemLink = getItemLink(item)

  const chartHeight = variant === 'rail' ? 120 : 140
  const cardHeight = variant === 'rail' ? 160 : 180

  return (
    <article
      className={`relative bg-white dark:bg-[var(--card-background)] border border-[var(--accent-active-border)] dark:border-gray-700 rounded-2xl overflow-hidden cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 ${
        variant === 'rail' ? 'snap-start flex flex-col' : ''
      }`}
      style={{
        height: cardHeight,
        ...(variant === 'rail' ? { width: 260, flexShrink: 0 } : {}),
      }}
    >
      {/* Star */}
      <div className="absolute top-2 right-2 z-[2]">
        <FavStar item={item} />
      </div>

      <Link href={itemLink} className="block p-4">
        <div className="relative mb-3" style={{ height: chartHeight }}>
          <TradingViewMiniChart
            ticker={item.ticker}
            height={chartHeight}
            largeChartUrl={itemLink}
          />
          <div className="absolute inset-0 z-[1]" />
        </div>

        {hasFooter && (
          <div className="flex items-center gap-2 pt-2.5 border-t border-dashed border-gray-200 dark:border-gray-700 text-[11px] text-gray-500 dark:text-gray-400">
            {hasEarnings && (
              <span
                className="inline-flex items-center gap-1 font-semibold shrink-0"
                style={{ color: 'var(--tab-active)' }}
              >
                <span>📅</span> {earningsInDays}d
              </span>
            )}
            {hasEarnings && hasNews && (
              <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
            )}
            {hasNews && (
              <span className="truncate flex-1" title={headline}>
                {headline}
              </span>
            )}
          </div>
        )}
      </Link>
    </article>
  )
}
