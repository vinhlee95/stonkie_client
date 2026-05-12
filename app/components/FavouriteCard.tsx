'use client'

import Link from 'next/link'
import { useId, useState } from 'react'
import { Star } from 'lucide-react'
import { Company } from '@/app/CompanyList'
import { ETFListItem } from '@/app/components/ETFList'
import { useFavourites } from './hooks/useFavourites'

type FavouriteItem = Company | ETFListItem

function isETF(item: FavouriteItem): item is ETFListItem {
  return 'fund_provider' in item
}

function getItemLink(item: FavouriteItem): string {
  return isETF(item) ? `/etf/${item.ticker}` : `/tickers/${item.ticker}`
}

function LogoFallback({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #286956, #4ea88a)',
        fontSize: size * 0.36,
        letterSpacing: '-0.02em',
      }}
    >
      {initials}
    </div>
  )
}

function Logo({ url, name, size = 40 }: { url?: string; name: string; size?: number }) {
  const [err, setErr] = useState(false)
  if (err || !url) return <LogoFallback name={name} size={size} />
  return (
    <img
      src={url}
      alt={name}
      onError={() => setErr(true)}
      className="rounded-full object-contain bg-white border border-black/6 dark:border-white/10"
      style={{ width: size, height: size }}
    />
  )
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
  price?: number
  change?: number
  changePct?: number
  dir?: 'up' | 'down'
  sparkData?: number[]
  earningsInDays?: number
  headline?: string
}

function Sparkline({
  points,
  dir = 'up',
  width = 84,
  height = 32,
}: {
  points: number[]
  dir?: 'up' | 'down'
  width?: number
  height?: number
}) {
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const stepX = width / (points.length - 1)
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${height - ((p - min) / range) * height}`)
    .join(' ')
  const fillPath = `${path} L ${width} ${height} L 0 ${height} Z`
  const stroke = dir === 'up' ? 'var(--tab-active)' : 'var(--accent-down)'
  const gradId = `sg-${useId()}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradId})`} />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function FavouriteCard({
  item,
  variant = 'grid',
  price,
  change,
  changePct,
  dir,
  sparkData,
  earningsInDays,
  headline,
}: FavouriteCardProps) {
  const hasPrice = price != null && changePct != null
  const hasSpark = sparkData && sparkData.length > 1
  const hasEarnings = earningsInDays != null && earningsInDays <= 60
  const hasNews = !!headline
  const hasFooter = hasEarnings || hasNews
  const isUp = dir === 'up'
  const exchange = isETF(item) ? undefined : item.exchange
  const name = item.name
  const logoUrl = item.logo_url

  if (variant === 'rail') {
    return (
      <article
        className="snap-start bg-white dark:bg-[var(--card-background)] border border-gray-200 dark:border-gray-700 rounded-2xl p-4 cursor-pointer flex flex-col transition-transform duration-150 hover:-translate-y-0.5"
        style={{ width: 260, flexShrink: 0 }}
      >
        <Link href={getItemLink(item)} className="flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <Logo url={logoUrl} name={name} size={36} />
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                {name}
              </div>
              <div className="flex gap-1.5 items-center mt-0.5">
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

          {/* Price panel with tinted background */}
          {hasPrice && (
            <div
              className="rounded-xl px-3 py-3.5 mb-3"
              style={{
                background: isUp
                  ? 'var(--accent-active-soft, rgba(40,105,86,0.04))'
                  : 'var(--accent-down-soft, rgba(170,60,60,0.04))',
              }}
            >
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="font-mono text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  {price!.toFixed(2)}
                </span>
                <span
                  className="font-mono text-xs font-semibold"
                  style={{ color: isUp ? 'var(--tab-active)' : 'var(--accent-down)' }}
                >
                  {isUp ? '+' : ''}
                  {changePct!.toFixed(2)}%
                </span>
              </div>
              {hasSpark && <Sparkline points={sparkData!} dir={dir} width={228} height={36} />}
            </div>
          )}

          {/* Earnings pill */}
          {hasEarnings && (
            <div
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full self-start mb-2.5"
              style={{
                color: 'var(--tab-active)',
                background: 'var(--accent-active-soft, rgba(40,105,86,0.08))',
              }}
            >
              <span>📅</span> Earnings · {earningsInDays}d
            </div>
          )}

          {/* News headline */}
          {hasNews && (
            <div className="text-xs text-gray-700 dark:text-gray-300 leading-snug mt-auto line-clamp-2">
              <span className="text-[9px] font-bold tracking-widest uppercase text-[var(--tab-active)] dark:text-[var(--accent-active-dark)] mr-1.5">
                News
              </span>
              {headline}
            </div>
          )}
        </Link>
      </article>
    )
  }

  // Grid variant (desktop)
  return (
    <article className="bg-white dark:bg-[var(--card-background)] border border-[var(--accent-active-border)] dark:border-gray-700 rounded-2xl p-4 relative overflow-hidden cursor-pointer transition-transform duration-150 hover:-translate-y-0.5">
      {/* Left accent stripe — only when price data exists */}
      {hasPrice && (
        <div
          className="absolute top-0 left-0 w-1 h-full opacity-85"
          style={{ background: isUp ? 'var(--tab-active)' : 'var(--accent-down)' }}
        />
      )}

      <Link href={getItemLink(item)} className="block">
        {/* Header: logo + name + star */}
        <div className="flex items-center gap-3 mb-3">
          <Logo url={logoUrl} name={name} size={40} />
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {name}
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
          <FavStar item={item} />
        </div>

        {/* Price + sparkline row */}
        {hasPrice && (
          <div className="flex justify-between items-end mb-3">
            <div>
              <div className="font-mono text-[22px] font-bold tracking-tight text-gray-900 dark:text-gray-100 leading-none">
                {price!.toFixed(2)}
              </div>
              <div
                className="font-mono text-xs font-semibold mt-1"
                style={{ color: isUp ? 'var(--tab-active)' : 'var(--accent-down)' }}
              >
                {isUp ? '▲' : '▼'} {isUp ? '+' : ''}
                {change!.toFixed(2)} ({isUp ? '+' : ''}
                {changePct!.toFixed(2)}%)
              </div>
            </div>
            {hasSpark && <Sparkline points={sparkData!} dir={dir} />}
          </div>
        )}

        {/* Footer — earnings + news */}
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
