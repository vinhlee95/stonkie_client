'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Plus, X } from 'lucide-react'
import {
  toYahooSymbol,
  type LotInput,
  type NewLot,
  type PortfolioHolding,
} from '@/lib/api/portfolio'
import { money, plural, priceDp, shares } from '../format'
import { LotForm } from './LotForm'
import { LotList } from './LotList'
import { TickerSearch, type Selected } from './TickerSearch'
import { TickerLogo } from './ui'

export type HoldingModalState =
  | { ticker: string }
  | { preset: { ticker: string; name: string | null } | null }

/** Portfolio writes the modal performs; each rejects with a user-facing message. */
export interface HoldingActions {
  /** Add view: resolves once saved, then the modal closes. */
  addHolding: (ticker: string, input: NewLot) => Promise<void>
  /** Position view writes resolve once the portfolio refetched, so the open view is fresh. */
  addLot: (ticker: string, input: NewLot) => Promise<void>
  updateLot: (id: string, input: LotInput) => Promise<void>
  deleteLot: (id: string) => Promise<void>
  removeHolding: (ticker: string) => Promise<void>
}

export function HoldingModal({
  state,
  holdings,
  actions,
  onClose,
}: {
  state: HoldingModalState
  holdings: PortfolioHolding[]
  actions: HoldingActions
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const position =
    'ticker' in state ? (holdings.find((h) => h.ticker === state.ticker) ?? null) : null
  // Deleting a position's last lot drops it from the refetched portfolio.
  const gone = 'ticker' in state && !position
  useEffect(() => {
    if (gone) onClose()
  }, [gone, onClose])
  if (gone) return null

  const title = position ? `Edit ${position.ticker}` : 'Add holding'
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-3 pt-16 backdrop-blur-[3px] md:pt-28"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex w-[520px] max-w-full flex-col overflow-hidden rounded-[20px] bg-[var(--card-background)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/10">
          <h3 className="m-0 text-lg font-bold">{title}</h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </header>
        {position ? (
          <PositionView holding={position} actions={actions} onClose={onClose} />
        ) : (
          <AddView
            preset={'preset' in state ? state.preset : null}
            holdings={holdings}
            addHolding={actions.addHolding}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}

function AddView({
  preset,
  holdings,
  addHolding,
  onClose,
}: {
  preset: Selected | null
  holdings: PortfolioHolding[]
  addHolding: HoldingActions['addHolding']
  onClose: () => void
}) {
  const [selected, setSelected] = useState<Selected | null>(
    // Favourites store Finnhub symbols (BRK.B); holdings are priced by Yahoo (BRK-B).
    preset ? { ...preset, ticker: toYahooSymbol(preset.ticker) } : null,
  )
  const heldTickers = useMemo(() => new Set(holdings.map((h) => h.ticker)), [holdings])

  if (!selected) return <TickerSearch heldTickers={heldTickers} onSelect={setSelected} />

  const held = holdings.find((h) => h.ticker === selected.ticker)
  return (
    <div className="flex flex-col gap-3.5 px-5 py-4">
      <TickerCard ticker={selected.ticker} name={selected.name}>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="cursor-pointer text-sm font-semibold text-[var(--tab-active)] dark:text-[var(--accent-active-dark)]"
        >
          Change
        </button>
      </TickerCard>
      {held && (
        <p className="m-0 rounded-[10px] bg-[var(--accent-active-soft)] px-3 py-2 text-sm">
          You hold {shares(held.shares)} {held.shares === 1 ? 'share' : 'shares'} @{' '}
          {money(held.avg_cost, held.currency, priceDp(held.avg_cost))} avg. This adds a new lot.
        </p>
      )}
      {/* Keyed by ticker so switching tickers never carries typed values over. */}
      <LotForm
        key={selected.ticker}
        currency={held?.currency ?? null}
        submitLabel="Add to portfolio"
        onCancel={onClose}
        onSubmit={async (input) => {
          await addHolding(selected.ticker, { ...input, name: selected.name })
          onClose()
        }}
      />
    </div>
  )
}

function PositionView({
  holding: h,
  actions,
  onClose,
}: {
  holding: PortfolioHolding
  actions: HoldingActions
  onClose: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async () => {
    setBusy(true)
    setError(null)
    try {
      await actions.removeHolding(h.ticker)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex max-h-[65vh] flex-col gap-3.5 overflow-y-auto px-5 py-4">
        <TickerCard ticker={h.ticker} name={h.name}>
          {h.price !== null && (
            <b className="font-mono text-sm">{money(h.price, h.currency, priceDp(h.price))}</b>
          )}
        </TickerCard>
        <dl className="m-0 grid grid-cols-3 gap-2 text-sm">
          <Stat label="Shares">{shares(h.shares)}</Stat>
          <Stat label="Avg cost">{money(h.avg_cost, h.currency, priceDp(h.avg_cost))}</Stat>
          <Stat label="Cost basis">{money(h.shares * h.avg_cost, h.currency, 2)}</Stat>
        </dl>
        <LotList
          lots={h.lots}
          currency={h.currency}
          onUpdate={actions.updateLot}
          onDelete={actions.deleteLot}
        />
        {adding ? (
          <LotForm
            currency={h.currency}
            submitLabel="Add lot"
            onCancel={() => setAdding(false)}
            onSubmit={async (input) => {
              await actions.addLot(h.ticker, { ...input, name: h.name })
              setAdding(false)
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 self-start text-sm font-semibold text-[var(--tab-active)] dark:text-[var(--accent-active-dark)]"
          >
            <Plus size={16} />
            Add lot
          </button>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="m-0 px-5 pb-2 text-sm text-[var(--accent-down)] dark:text-red-400"
        >
          {error}
        </p>
      )}
      <footer className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-3.5 dark:border-white/10">
        {confirmRemove ? (
          <span className="flex flex-wrap items-center gap-2 text-sm">
            <span>
              Remove {h.ticker} and its {plural(h.lots.length, 'lot')}?
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => void remove()}
              className="cursor-pointer font-semibold text-[var(--accent-down)] disabled:opacity-50 dark:text-red-400"
            >
              {busy ? 'Removing…' : 'Yes, remove'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmRemove(false)}
              className="cursor-pointer font-semibold disabled:opacity-50"
            >
              No
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="cursor-pointer text-sm font-semibold text-[var(--accent-down)] dark:text-red-400"
          >
            Remove position
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-full border border-[var(--accent-active-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--accent-active-soft)] dark:border-white/15"
        >
          Close
        </button>
      </footer>
    </>
  )
}

function TickerCard({
  ticker,
  name,
  children,
}: {
  ticker: string
  name: string | null
  children?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-white/5">
      <TickerLogo ticker={ticker} size={36} />
      <div className="flex min-w-0 flex-1 flex-col leading-snug">
        <b className="text-base">{ticker}</b>
        {name && (
          <span className="truncate text-xs text-gray-500 dark:text-gray-400">{name}</span>
        )}
      </div>
      {children}
    </div>
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="m-0 font-mono font-semibold">{children}</dd>
    </div>
  )
}
