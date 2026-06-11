'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { TICKER_SLIDE_IN_FLAG } from '@/app/tickers/[ticker]/TickerEntryTransition'
import type { Company } from '@/app/CompanyList'
import type { PriceChange } from '@/lib/api/quotes'

function Avatar({ url, name }: { url?: string; name: string }) {
  const [err, setErr] = useState(false)

  if (err || !url) {
    const initials = name
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 2)
      .toUpperCase()
    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #286956, #4ea88a)' }}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={name}
      onError={() => setErr(true)}
      className="w-10 h-10 rounded-full object-contain bg-white border border-black/6 dark:border-white/10 flex-shrink-0"
    />
  )
}

export interface WatchlistRowProps {
  company: Company
  /** Market flag emoji for the company's market. */
  flag: string
  /** Latest completed trading day's price change. Omitted while loading or when unavailable. */
  quote?: PriceChange
  /** Called when the row is tapped — used to close the brief modal before navigating. */
  onNavigate?: () => void
  /** Called when the star is tapped — removes the company from favourites. */
  onRemove: (ticker: string) => void
}

/**
 * A single favourite row in the watchlist section. Tapping navigates to the
 * company's ticker page. Shows avatar, ticker, company name, and market flag.
 */
/** Formats an ISO trading date (e.g. "2026-06-10") as a short label like "Jun 10". */
function formatTradingDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Daily change badge — % change of the latest completed trading day, with the
 * trading date underneath so it's clear which session the change refers to.
 * Neutral grey when flat so colour only signals actual movement.
 */
function ChangeBadge({ quote }: { quote: PriceChange }) {
  const flat = quote.change === 0
  const up = quote.change > 0
  const colour = flat
    ? 'text-gray-500 dark:text-gray-400'
    : up
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400'
  const sign = up ? '+' : ''

  return (
    <span className="flex flex-col items-end shrink-0">
      <span className={`font-mono text-sm font-semibold tabular-nums ${colour}`}>
        {sign}
        {quote.change_percent.toFixed(2)}%
      </span>
      <span className="text-[10px] leading-tight text-gray-400 dark:text-gray-500">
        {formatTradingDate(quote.trading_date)}
      </span>
    </span>
  )
}

export default function WatchlistRow({
  company,
  flag,
  quote,
  onNavigate,
  onRemove,
}: WatchlistRowProps) {
  const handleClick = () => {
    // Signal the destination page to slide in from the right, then close the modal
    // (which plays its slide-down exit) before the Link navigates.
    try {
      sessionStorage.setItem(TICKER_SLIDE_IN_FLAG, '1')
    } catch {
      // sessionStorage may be unavailable (e.g. private mode) — navigation still works
    }
    onNavigate?.()
  }

  return (
    <Link
      href={`/tickers/${company.ticker}`}
      onClick={handleClick}
      className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[var(--card-background)] px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer"
    >
      <Avatar url={company.logo_url} name={company.name} />
      <div className="min-w-0 flex-1 flex items-center gap-1.5">
        <span className="font-mono text-base font-bold text-gray-900 dark:text-gray-100">
          {company.ticker}
        </span>
        <span className="text-gray-400 dark:text-gray-500">·</span>
        <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{company.name}</span>
        <span className="text-sm leading-none shrink-0" aria-hidden>
          {flag}
        </span>
      </div>
      {quote && <ChangeBadge quote={quote} />}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onRemove(company.ticker)
        }}
        className="p-1.5 -mr-1 shrink-0 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
        aria-label={`Remove ${company.ticker} from favourites`}
        title="Remove from favourites"
      >
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      </button>
    </Link>
  )
}
