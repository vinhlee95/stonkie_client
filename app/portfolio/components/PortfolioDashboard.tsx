'use client'

import { useCallback, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import type { Company } from '@/app/CompanyList'
import { useFavourites } from '@/app/components/hooks/useFavourites'
import {
  fetchPortfolio,
  PORTFOLIO_QUERY_KEY,
  removeHolding,
  saveHolding,
  type Portfolio,
  type PortfolioHolding,
} from '@/lib/api/portfolio'
import { HoldingModal, type HoldingModalState } from './HoldingModal'
import { HoldingsList, HoldingsTable } from './holdings'
import {
  Allocation,
  Dividends,
  Events,
  Movers,
  News,
  PerformanceChart,
  PortfolioSummary,
  Risk,
} from './sections'
import { TickerLogo } from './ui'

export default function PortfolioDashboard({ initialData }: { initialData: Portfolio }) {
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: PORTFOLIO_QUERY_KEY,
    queryFn: fetchPortfolio,
    initialData,
    staleTime: 60 * 1000,
  })
  const [modal, setModal] = useState<HoldingModalState | null>(null)

  // Mutations resolve (and the dialog closes) as soon as the write succeeds;
  // the revalued portfolio refetches in the background.
  const refresh = useCallback(
    () => void queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY }),
    [queryClient],
  )
  const onSave = useCallback(
    async (ticker: string, input: { shares: number; avg_cost: number; name: string | null }) => {
      await saveHolding(ticker, input)
      refresh()
    },
    [refresh],
  )
  const onRemove = useCallback(
    async (ticker: string) => {
      await removeHolding(ticker)
      refresh()
    },
    [refresh],
  )
  const closeModal = useCallback(() => setModal(null), [])

  const { summary: s, holdings, base_currency: currency } = data
  const heldTickers = useMemo(() => new Set(holdings.map((h) => h.ticker)), [holdings])
  const add = (preset: { ticker: string; name: string | null } | null = null) =>
    setModal({ preset })
  const edit = (holding: PortfolioHolding) => setModal({ holding })
  const unpriced = holdings.filter((h) => h.value === null)

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-3.5 px-2.5 pb-24 pt-5 md:gap-5 md:px-0 md:pt-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-extrabold tracking-tight md:text-[28px]">Portfolio</h1>
          {s.holdings_count > 0 && (
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {s.holdings_count} holdings · values in {currency}
              {s.as_of && ` · prices as of ${s.as_of}`}
            </div>
          )}
        </div>
        {s.holdings_count > 0 && (
          <button
            type="button"
            onClick={() => add()}
            className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--primary-button-background)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-button-hover)]"
          >
            <Plus size={16} />
            <span className="md:hidden">Add</span>
            <span className="hidden md:inline">Add holding</span>
          </button>
        )}
      </div>

      {s.holdings_count === 0 ? (
        <EmptyState onAdd={add} />
      ) : (
        <>
          {unpriced.length > 0 && (
            <p
              role="status"
              className="m-0 rounded-xl bg-amber-600/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300"
            >
              No price for {unpriced.map((h) => h.ticker).join(', ')} right now — excluded from
              totals.
            </p>
          )}
          <div className="grid grid-cols-1 items-start gap-3.5 md:gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="min-w-0 rounded-2xl border border-[var(--accent-active-border)] bg-[var(--card-background)] px-3.5 pb-3.5 pt-3 md:px-[18px] md:pb-[18px] md:pt-3.5 dark:border-white/10">
              <PortfolioSummary s={s} currency={currency} />
              <div className="md:hidden">
                <PerformanceChart height={150} compact />
              </div>
              <div className="hidden md:block">
                <PerformanceChart height={250} />
              </div>
            </section>
            <div className="hidden min-w-0 flex-col gap-5 lg:flex">
              <Allocation holdings={holdings} />
              <Risk holdings={holdings} />
            </div>
          </div>

          <div className="md:hidden">
            <Movers holdings={holdings} currency={currency} limit={4} />
          </div>
          <div className="md:hidden">
            <HoldingsList holdings={holdings} currency={currency} onEdit={edit} />
          </div>
          <div className="hidden md:block">
            <HoldingsTable holdings={holdings} currency={currency} onEdit={edit} />
          </div>
          <div className="flex flex-col gap-3.5 md:gap-5 lg:hidden">
            <Allocation holdings={holdings} variant="bars" />
            <Risk holdings={holdings} />
          </div>

          <div className="grid grid-cols-1 items-start gap-3.5 md:grid-cols-3 md:gap-5">
            <div className="hidden md:block">
              <Movers holdings={holdings} currency={currency} />
            </div>
            <News limit={4} />
            <Events limit={5} />
          </div>
          <Dividends wide />
        </>
      )}

      {modal && (
        <HoldingModal
          state={modal}
          heldTickers={heldTickers}
          holdings={holdings}
          onClose={closeModal}
          onSave={onSave}
          onRemove={onRemove}
        />
      )}
    </main>
  )
}

function EmptyState({
  onAdd,
}: {
  onAdd: (preset?: { ticker: string; name: string | null } | null) => void
}) {
  const { favourites } = useFavourites<Company>('stonkie_favourites')
  const favs = favourites.slice(0, 6)
  return (
    <section className="flex max-w-[680px] flex-col items-start gap-4 rounded-2xl border border-[var(--accent-active-border)] bg-[var(--card-background)] px-[18px] py-6 md:p-12 dark:border-white/10">
      <h2 className="m-0 text-2xl font-extrabold">Track what you own</h2>
      <p className="m-0 text-base leading-relaxed text-gray-700 md:text-lg dark:text-gray-300">
        Add a ticker, the number of shares and what you paid. Stonkie tracks value, daily moves and
        total return for everything you hold, in EUR.
      </p>
      <button
        type="button"
        onClick={() => onAdd(null)}
        className="mt-1 flex w-full cursor-text items-center gap-2.5 rounded-[14px] border border-[var(--accent-active-border)] bg-gray-50 px-4 py-3.5 text-left text-base text-gray-500 hover:border-[var(--tab-active)] dark:border-white/15 dark:bg-white/5"
      >
        <Search size={18} />
        <span>Search ticker or company…</span>
      </button>
      {favs.length > 0 && (
        <div className="mt-1 flex w-full flex-col gap-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">
            From your favourites
          </div>
          <div className="flex flex-wrap gap-2">
            {favs.map((f) => (
              <button
                key={f.ticker}
                type="button"
                onClick={() => onAdd({ ticker: f.ticker, name: f.name })}
                className="inline-flex min-h-9 cursor-pointer items-center gap-[7px] rounded-full border border-[var(--accent-active-border)] py-1.5 pl-1.5 pr-3 text-sm hover:border-[var(--tab-active)] hover:bg-[var(--accent-active-soft)] dark:border-white/15"
              >
                <TickerLogo ticker={f.ticker} size={20} />
                <b>{f.ticker}</b>
                <Plus size={14} className="text-[var(--tab-active)]" />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
