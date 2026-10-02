'use client'

import { useState } from 'react'
import type { PortfolioHolding } from '@/lib/api/portfolio'
import { money, pct, priceDp, shares, signedMoney, tone, TONE_TEXT } from '../format'
import { DelayedTag, Delta, TickerLogo } from './ui'

export type SortKey =
  | 'ticker'
  | 'shares'
  | 'avg_cost'
  | 'price'
  | 'day_change_percent'
  | 'value'
  | 'total_return'
  | 'weight'

const COLS: { k: SortKey; l: string; r?: boolean }[] = [
  { k: 'ticker', l: 'Holding' },
  { k: 'shares', l: 'Shares', r: true },
  { k: 'avg_cost', l: 'Avg cost', r: true },
  { k: 'price', l: 'Price', r: true },
  { k: 'day_change_percent', l: 'Today', r: true },
  { k: 'value', l: 'Value €', r: true },
  { k: 'total_return', l: 'Return', r: true },
  { k: 'weight', l: 'Weight', r: true },
]

const DASH = <span className="text-gray-400">—</span>

/** Sorts by column; unpriced (null) values go last in either direction. */
export function sortRows(rows: PortfolioHolding[], k: SortKey, d: 1 | -1) {
  return [...rows].sort((a, b) => {
    const x = a[k]
    const y = b[k]
    if (x === null) return y === null ? 0 : 1
    if (y === null) return -1
    return (
      (typeof x === 'string' ? x.localeCompare(y as string) : (x as number) - (y as number)) * d
    )
  })
}

export function HoldingsTable({
  holdings,
  currency,
  onEdit,
}: {
  holdings: PortfolioHolding[]
  currency: string
  onEdit: (h: PortfolioHolding) => void
}) {
  const [sort, setSort] = useState<{ k: SortKey; d: 1 | -1 }>({ k: 'value', d: -1 })
  const rows = sortRows(holdings, sort.k, sort.d)
  const onSort = (k: SortKey) =>
    setSort((p) => ({ k, d: p.k === k ? (-p.d as 1 | -1) : k === 'ticker' ? 1 : -1 }))

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-[var(--accent-active-border)] bg-[var(--card-background)] dark:border-white/10">
      <header className="flex items-center justify-between gap-2.5 px-[18px] pt-4">
        <h3 className="m-0 text-base font-bold">Holdings</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Native prices · totals in {currency} · click a row to edit
        </span>
      </header>
      <div className="overflow-x-auto pb-1 pt-2">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th
                  key={c.k}
                  aria-sort={sort.k === c.k ? (sort.d > 0 ? 'ascending' : 'descending') : undefined}
                  className={`whitespace-nowrap border-b border-gray-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide first:pl-[18px] last:pr-[18px] dark:border-white/10 ${
                    c.r ? 'text-right' : 'text-left'
                  } ${sort.k === c.k ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  <button
                    type="button"
                    className="cursor-pointer uppercase"
                    onClick={() => onSort(c.k)}
                  >
                    {c.l}
                    {sort.k === c.k && <span className="ml-1">{sort.d > 0 ? '↑' : '↓'}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr
                key={h.ticker}
                onClick={() => onEdit(h)}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 [&:last-child>td]:border-b-0"
              >
                <td className="whitespace-nowrap border-b border-gray-100 px-3 py-2.5 pl-[18px] dark:border-white/10">
                  <button
                    type="button"
                    className="flex cursor-pointer items-center gap-2.5 text-left"
                    aria-label={`Edit ${h.ticker}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(h)
                    }}
                  >
                    <TickerLogo ticker={h.ticker} size={30} />
                    <span className="flex flex-col leading-tight">
                      <span className="flex items-center gap-1.5">
                        <b className="text-sm">{h.ticker}</b>
                        {h.delayed && <DelayedTag />}
                      </span>
                      {h.name && (
                        <span className="max-w-[170px] truncate text-xs text-gray-500 dark:text-gray-400">
                          {h.name}
                        </span>
                      )}
                    </span>
                  </button>
                </td>
                <Td>
                  {shares(h.shares)}
                  {h.lots.length > 1 && (
                    <div className="font-sans text-xs text-gray-500 dark:text-gray-400">
                      {h.lots.length} lots
                    </div>
                  )}
                </Td>
                <Td muted>{money(h.avg_cost, h.currency, priceDp(h.avg_cost))}</Td>
                <Td>{h.price === null ? DASH : money(h.price, h.currency, priceDp(h.price))}</Td>
                <Td>
                  {h.day_change_percent === null ? (
                    DASH
                  ) : (
                    <Delta v={h.day_change_percent}>
                      {Math.abs(h.day_change_percent).toFixed(2)}%
                    </Delta>
                  )}
                </Td>
                <Td bold>{h.value === null ? DASH : money(h.value, currency, 0)}</Td>
                <Td>
                  {h.total_return === null || h.total_return_percent === null ? (
                    DASH
                  ) : (
                    <>
                      <div className={TONE_TEXT[tone(h.total_return)]}>
                        {signedMoney(h.total_return, currency, 0)}
                      </div>
                      <div className={`text-xs ${TONE_TEXT[tone(h.total_return)]}`}>
                        {pct(h.total_return_percent, 1)}
                      </div>
                    </>
                  )}
                </Td>
                <Td last>
                  {h.weight === null ? (
                    DASH
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      <span>{h.weight.toFixed(1)}%</span>
                      <i className="block h-1 w-14 overflow-hidden rounded-sm bg-gray-100 dark:bg-white/10">
                        <em
                          className="block h-full bg-[var(--tab-active)]"
                          style={{ width: `${Math.min(100, h.weight * 4)}%` }}
                        />
                      </i>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Td({
  children,
  muted,
  bold,
  last,
}: {
  children: React.ReactNode
  muted?: boolean
  bold?: boolean
  last?: boolean
}) {
  return (
    <td
      className={`whitespace-nowrap border-b border-gray-100 px-3 py-2.5 text-right align-middle font-mono tabular-nums dark:border-white/10 ${
        muted ? 'text-gray-500 dark:text-gray-400' : ''
      } ${bold ? 'font-bold' : ''} ${last ? 'pr-[18px]' : ''}`}
    >
      {children}
    </td>
  )
}

export function HoldingsList({
  holdings,
  currency,
  onEdit,
}: {
  holdings: PortfolioHolding[]
  currency: string
  onEdit: (h: PortfolioHolding) => void
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-[var(--accent-active-border)] bg-[var(--card-background)] dark:border-white/10">
      <header className="flex items-center justify-between gap-2.5 px-3.5 pt-3.5">
        <h3 className="m-0 text-base font-bold">Holdings</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {holdings.length} · by value
        </span>
      </header>
      <ul className="m-0 list-none px-3.5 pb-2 pt-1.5">
        {sortRows(holdings, 'value', -1).map((h, i) => (
          <li key={h.ticker} className={i ? 'border-t border-gray-100 dark:border-white/10' : ''}>
            <button
              type="button"
              onClick={() => onEdit(h)}
              aria-label={`Edit ${h.ticker}`}
              className="flex min-h-14 w-full cursor-pointer items-center gap-3 py-[11px] text-left"
            >
              <TickerLogo ticker={h.ticker} size={34} />
              <span className="flex min-w-0 flex-1 flex-col leading-snug">
                <span className="flex items-center gap-1.5">
                  <b className="text-base">{h.ticker}</b>
                  {h.delayed && <DelayedTag />}
                </span>
                <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                  {shares(h.shares)} ×{' '}
                  {h.price === null ? '—' : money(h.price, h.currency, priceDp(h.price))}
                  {h.lots.length > 1 && ` · ${h.lots.length} lots`}
                </span>
              </span>
              <span className="flex flex-col items-end leading-snug">
                <b className="font-mono text-base">
                  {h.value === null ? '—' : money(h.value, currency, 0)}
                </b>
                {h.day_change_percent !== null && (
                  <Delta v={h.day_change_percent} className="text-xs">
                    {Math.abs(h.day_change_percent).toFixed(2)}%
                  </Delta>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
