'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useTickerSearch } from '@/app/components/hooks/useTickerSearch'
import { TICKER_RE, toYahooSymbol } from '@/lib/api/portfolio'
import { TickerLogo } from './ui'

export type Selected = { ticker: string; name: string | null }

export function TickerSearch({
  heldTickers,
  onSelect,
}: {
  heldTickers: Set<string>
  onSelect: (s: Selected) => void
}) {
  const [q, setQ] = useState('')
  const query = q.trim()
  // Yahoo search: holdings are priced by Yahoo, and it returns ETFs / non-US listings with suffixes.
  const { results: found, isLoading: loading } = useTickerSearch(query, 300, 'yahoo')
  const results = found.slice(0, 6)

  const raw = toYahooSymbol(query.toUpperCase())
  // Hidden until the search settles, so a quick click can't pick bare SXR8 before SXR8.DE arrives.
  const showRaw = !loading && TICKER_RE.test(raw) && !results.some((r) => r.symbol === raw)

  return (
    <div className="flex flex-col gap-3.5 px-5 py-4">
      <div className="flex items-center gap-2.5 rounded-xl border border-[var(--accent-active-border)] px-3.5 text-gray-500 focus-within:border-[var(--tab-active)] focus-within:ring-3 focus-within:ring-[var(--accent-active-soft)] dark:border-white/15">
        <Search size={18} />
        <input
          autoFocus
          aria-label="Search ticker or company"
          placeholder="Search ticker or company…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-[var(--foreground)] outline-none"
        />
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {results.map((r) => (
          <li key={r.symbol}>
            <ResultRow
              ticker={r.symbol}
              sub={r.exchange ? `${r.name} · ${r.exchange}` : r.name}
              held={heldTickers.has(r.symbol)}
              onClick={() => onSelect({ ticker: r.symbol, name: r.name })}
            />
          </li>
        ))}
        {loading && results.length === 0 && (
          <li className="px-1 py-2 text-sm text-gray-500" aria-live="polite">
            Searching…
          </li>
        )}
        {showRaw && (
          <li>
            <ResultRow
              ticker={raw}
              sub="Use this Yahoo Finance symbol (ETFs, non-US listings)"
              held={heldTickers.has(raw)}
              onClick={() => onSelect({ ticker: raw, name: null })}
            />
          </li>
        )}
      </ul>
    </div>
  )
}

function ResultRow({
  ticker,
  sub,
  held,
  onClick,
}: {
  ticker: string
  sub: string
  held: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-[10px] px-2 py-2.5 text-left hover:bg-[var(--accent-active-soft)]"
    >
      <TickerLogo ticker={ticker} size={30} />
      <span className="flex min-w-0 flex-1 flex-col leading-snug">
        <b className="text-base">{ticker}</b>
        <span className="truncate text-xs text-gray-500 dark:text-gray-400">{sub}</span>
      </span>
      {held && (
        <span className="rounded-full bg-[var(--accent-active-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--tab-active)] dark:text-[var(--accent-active-dark)]">
          In portfolio
        </span>
      )}
    </button>
  )
}
