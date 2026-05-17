'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Star } from 'lucide-react'
import { Company } from '@/app/CompanyList'
import { ETFListItem } from '@/app/components/ETFList'
import { useFavourites } from './hooks/useFavourites'
import TradingViewMiniChart from './TradingViewMiniChart'
import { toTradingViewSymbol, isRestricted } from '@/app/lib/tradingview'

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

function LogoFallback({ name }: { name: string }) {
  const initials = name
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
      style={{ background: 'linear-gradient(135deg, #286956, #4ea88a)' }}
    >
      {initials}
    </div>
  )
}

function CardLogo({ url, name }: { url?: string; name: string }) {
  const [err, setErr] = useState(false)
  if (err || !url) return <LogoFallback name={name} />
  return (
    <img
      src={url}
      alt={name}
      onError={() => setErr(true)}
      className="w-10 h-10 rounded-full object-contain bg-white border border-black/6 dark:border-white/10"
    />
  )
}

function CompactCardBody({ item }: { item: FavouriteItem }) {
  const logoUrl = 'logo_url' in item ? (item as Company).logo_url : undefined
  const exchange = 'exchange' in item ? (item as Company).exchange : undefined
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">
        <CardLogo url={logoUrl} name={item.name} />
      </div>
      <div className="min-w-0">
        <div className="text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
          {item.name}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="font-mono text-base text-gray-500 dark:text-gray-400 font-semibold">
            {item.ticker}
          </span>
          {exchange && (
            <span className="text-[9px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-px rounded tracking-wide">
              {exchange}
            </span>
          )}
        </div>
      </div>
    </div>
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

  const showChart = !isRestricted(toTradingViewSymbol(item.ticker))
  const chartHeight = variant === 'rail' ? 120 : 140
  const cardHeight = showChart ? (variant === 'rail' ? 160 : 180) : undefined

  return (
    <article
      className={`relative bg-white dark:bg-[var(--card-background)] border border-[var(--accent-active-border)] dark:border-gray-700 rounded-2xl overflow-hidden cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 ${
        variant === 'rail' ? 'snap-start flex flex-col' : ''
      }`}
      style={{
        ...(cardHeight ? { height: cardHeight } : {}),
        ...(variant === 'rail' ? { width: 260, flexShrink: 0 } : {}),
      }}
    >
      {/* Star */}
      <div className="absolute top-2 right-2 z-[2]">
        <FavStar item={item} />
      </div>

      <Link href={itemLink} className="block p-4">
        {showChart && (
          <div className="relative mb-3" style={{ height: chartHeight }}>
            <TradingViewMiniChart
              ticker={item.ticker}
              height={chartHeight}
              largeChartUrl={itemLink}
            />
            <div className="absolute inset-0 z-[1]" />
          </div>
        )}

        {!showChart && <CompactCardBody item={item} />}

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
