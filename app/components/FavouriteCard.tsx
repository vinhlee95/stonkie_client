'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Star } from 'lucide-react'
import { Company } from '@/app/CompanyList'
import { ETFListItem } from '@/app/components/ETFList'
import { useFavourites } from './hooks/useFavourites'
import TradingViewMiniChart from './TradingViewMiniChart'
import { formatRecapCreatedAt } from './RecapCuratedChip'
import RecapAudioControls from './RecapAudioControls'
import { toTradingViewSymbol, isRestricted } from '@/app/lib/tradingview'
import type { TickerRecapItem } from '@/lib/api/tickerRecap'

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

type RecapMode = 'daily' | 'weekly'

/**
 * Compact Daily / Weekly segmented switch inside a recap caption. Card-level state.
 * Buttons stop propagation so tapping them never triggers the card's Link navigation.
 */
function RecapModeSwitch({
  mode,
  onChange,
}: {
  mode: RecapMode
  onChange: (m: RecapMode) => void
}) {
  const opts: { k: RecapMode; label: string; title: string }[] = [
    { k: 'daily', label: 'D', title: 'Daily recap' },
    { k: 'weekly', label: 'W', title: 'Weekly recap' },
  ]
  return (
    <div className="inline-flex gap-0.5 p-0.5 rounded-full bg-gray-100 dark:bg-gray-700">
      {opts.map((o) => {
        const on = mode === o.k
        return (
          <button
            key={o.k}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onChange(o.k)
            }}
            className={`w-6 h-5 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
              on
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'bg-transparent text-gray-400 dark:text-gray-500'
            }`}
            aria-pressed={on}
            aria-label={o.title}
            title={o.title}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Inline recap caption under a card's chart: a "✦ Recap · {time}" label, a Daily/Weekly
 * mode switch, and the recap summary. Weekly has no precomputed data yet, so its tab shows
 * a placeholder until the backend supplies weekly recaps.
 */
function RecapCaption({ recap, ticker }: { recap: TickerRecapItem; ticker: string }) {
  const [mode, setMode] = useState<RecapMode>('daily')
  const timestamp = recap.created_at ? formatRecapCreatedAt(recap.created_at) : null
  return (
    <div className="pt-3 pb-1 mt-1 border-t border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
          <span className="text-amber-500 dark:text-amber-400">✦</span>Recap
        </span>
        {mode === 'daily' && timestamp && (
          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
            · {timestamp}
          </span>
        )}
        <div className="ml-auto">
          <RecapModeSwitch mode={mode} onChange={setMode} />
        </div>
      </div>
      {mode === 'daily' ? (
        <>
          <p className="m-0 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {recap.summary}
          </p>
          {/* Only dailies are narrated; renders nothing when this one has no clip. */}
          <RecapAudioControls
            audio={recap.audio}
            trackId={`home:ticker:${ticker.toUpperCase()}:${recap.id}`}
            title={`${ticker.toUpperCase()} recap`}
            className="mt-2.5"
          />
        </>
      ) : (
        <p className="m-0 text-sm italic leading-relaxed text-gray-400 dark:text-gray-500">
          Weekly recap coming soon.
        </p>
      )}
    </div>
  )
}

export interface FavouriteCardProps {
  item: FavouriteItem
  variant?: 'grid' | 'rail'
  earningsInDays?: number
  headline?: string
  /** Latest precomputed daily recap for this ticker. Renders a caption under the chart when present. */
  recap?: TickerRecapItem | null
}

export default function FavouriteCard({
  item,
  variant = 'grid',
  earningsInDays,
  headline,
  recap,
}: FavouriteCardProps) {
  const hasEarnings = earningsInDays != null && earningsInDays <= 60
  const hasNews = !!headline
  const hasFooter = hasEarnings || hasNews
  const itemLink = getItemLink(item)

  const showChart = !isRestricted(toTradingViewSymbol(item.ticker))
  const chartHeight = variant === 'rail' ? 120 : 140
  // Fixed height only when the card has no recap caption; with a recap it grows to fit the text.
  const cardHeight = showChart && !recap ? (variant === 'rail' ? 160 : 180) : undefined

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

        {recap && <RecapCaption recap={recap} ticker={item.ticker} />}
      </Link>
    </article>
  )
}
