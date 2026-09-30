'use client'

import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useTickerSearch } from '@/app/components/hooks/useTickerSearch'
import {
  isAmbiguousDecimal,
  parseDecimal,
  TICKER_RE,
  toYahooSymbol,
  type PortfolioHolding,
} from '@/lib/api/portfolio'
import { money, priceDp } from '../format'
import { TickerLogo } from './ui'

export type HoldingModalState =
  | { holding: PortfolioHolding }
  | { preset: { ticker: string; name: string | null } | null }

type Selected = { ticker: string; name: string | null }

export function HoldingModal({
  state,
  heldTickers,
  holdings,
  onClose,
  onSave,
  onRemove,
}: {
  state: HoldingModalState
  heldTickers: Set<string>
  holdings: PortfolioHolding[]
  onClose: () => void
  onSave: (
    ticker: string,
    input: { shares: number; avg_cost: number; name: string | null },
  ) => Promise<void>
  onRemove: (ticker: string) => Promise<void>
}) {
  const editing = 'holding' in state ? state.holding : null
  const [selected, setSelected] = useState<Selected | null>(
    editing
      ? { ticker: editing.ticker, name: editing.name }
      : 'preset' in state && state.preset
        ? // Favourites store Finnhub symbols (BRK.B); holdings are priced by Yahoo (BRK-B).
          { ...state.preset, ticker: toYahooSymbol(state.preset.ticker) }
        : null,
  )
  const [sharesIn, setSharesIn] = useState(editing ? String(editing.shares) : '')
  const [costIn, setCostIn] = useState(editing ? String(editing.avg_cost) : '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const select = (s: Selected) => {
    setSelected(s)
    setError(null)
    const existing = holdings.find((h) => h.ticker === s.ticker)
    // Prefill a held position; otherwise don't carry the previous ticker's numbers over.
    setSharesIn(existing ? String(existing.shares) : '')
    setCostIn(existing ? String(existing.avg_cost) : '')
  }

  const sh = parseDecimal(sharesIn)
  const cost = parseDecimal(costIn)
  const ok = !!selected && sh > 0 && cost > 0
  const invalidInput =
    (sharesIn.trim() !== '' && !(sh > 0)) || (costIn.trim() !== '' && !(cost > 0))
  const ambiguous = [sharesIn, costIn].find(isAmbiguousDecimal)
  const currency =
    editing?.currency ?? holdings.find((h) => h.ticker === selected?.ticker)?.currency ?? null

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-3 pt-16 backdrop-blur-[3px] md:pt-28"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editing ? `Edit ${editing.ticker}` : 'Add holding'}
        className="flex w-[520px] max-w-full flex-col overflow-hidden rounded-[20px] bg-[var(--card-background)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/10">
          <h3 className="m-0 text-lg font-bold">
            {editing ? `Edit ${editing.ticker}` : 'Add holding'}
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </header>

        {!selected ? (
          <TickerSearch heldTickers={heldTickers} onSelect={select} />
        ) : (
          <form
            id="holding-form"
            className="flex flex-col gap-3.5 px-5 py-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (ok)
                void run(() =>
                  onSave(selected.ticker, { shares: sh, avg_cost: cost, name: selected.name }),
                )
            }}
          >
            <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-white/5">
              <TickerLogo ticker={selected.ticker} size={36} />
              <div className="flex min-w-0 flex-1 flex-col leading-snug">
                <b className="text-base">{selected.ticker}</b>
                {selected.name && (
                  <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {selected.name}
                  </span>
                )}
              </div>
              {editing?.price != null && (
                <b className="font-mono text-sm">
                  {money(editing.price, editing.currency, priceDp(editing.price))}
                </b>
              )}
              {!editing && (
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="cursor-pointer text-sm font-semibold text-[var(--tab-active)] dark:text-[var(--accent-active-dark)]"
                >
                  Change
                </button>
              )}
            </div>
            {!editing && heldTickers.has(selected.ticker) && (
              <p className="m-0 rounded-[10px] bg-amber-600/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                Already in your portfolio. Saving will replace the current position.
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Shares
                </span>
                <input
                  autoFocus
                  inputMode="decimal"
                  placeholder="0"
                  value={sharesIn}
                  onChange={(e) => setSharesIn(e.target.value)}
                  className="rounded-xl border border-[var(--accent-active-border)] bg-transparent px-3.5 py-3 font-mono text-base outline-none focus:border-[var(--tab-active)] focus:ring-3 focus:ring-[var(--accent-active-soft)] dark:border-white/15"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Average cost per share{currency ? ` (${currency})` : ''}
                </span>
                <input
                  inputMode="decimal"
                  placeholder="0.00"
                  value={costIn}
                  onChange={(e) => setCostIn(e.target.value)}
                  className="rounded-xl border border-[var(--accent-active-border)] bg-transparent px-3.5 py-3 font-mono text-base outline-none focus:border-[var(--tab-active)] focus:ring-3 focus:ring-[var(--accent-active-soft)] dark:border-white/15"
                />
              </label>
            </div>
            {!currency && (
              <p className="m-0 text-xs text-gray-500 dark:text-gray-400">
                Enter cost in the currency the stock trades in (e.g. USD for NASDAQ, EUR for
                Helsinki).
              </p>
            )}
            {invalidInput && (
              <p className="m-0 text-sm text-[var(--accent-down)] dark:text-red-400">
                {ambiguous
                  ? `Ambiguous — type ${Number(ambiguous.trim().replace(',', ''))} or ${ambiguous.trim().replace(',', '.')}`
                  : 'Enter positive numbers, e.g. 12 or 12.5'}
              </p>
            )}
            <div className="flex justify-between border-t border-dashed border-[var(--accent-active-border)] pt-3 text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Cost basis
              </span>
              <b className="font-mono">{ok ? money(sh * cost, currency, 2) : '—'}</b>
            </div>
          </form>
        )}

        {error && (
          <p
            role="alert"
            className="m-0 px-5 pb-2 text-sm text-[var(--accent-down)] dark:text-red-400"
          >
            {error}
          </p>
        )}

        <footer className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5 dark:border-white/10">
          {editing ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(() => onRemove(editing.ticker))}
              className="cursor-pointer text-sm font-semibold text-[var(--accent-down)] disabled:opacity-50 dark:text-red-400"
            >
              Remove
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full border border-[var(--accent-active-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--accent-active-soft)] dark:border-white/15"
            >
              Cancel
            </button>
            {selected && (
              <button
                type="submit"
                form="holding-form"
                disabled={!ok || busy}
                className="cursor-pointer rounded-full bg-[var(--primary-button-background)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-button-hover)] disabled:cursor-default disabled:bg-gray-300 dark:disabled:bg-gray-600"
              >
                {busy ? 'Saving…' : editing ? 'Save' : 'Add to portfolio'}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}

function TickerSearch({
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
