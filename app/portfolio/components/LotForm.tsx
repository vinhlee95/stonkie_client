'use client'

import { useState, type FormEvent } from 'react'
import {
  isAmbiguousDecimal,
  parseDecimal,
  type LotInput,
  type PortfolioLot,
} from '@/lib/api/portfolio'
import { localToday, money } from '../format'

const EARLIEST_DATE = '1900-01-01'
const INPUT =
  'rounded-xl border border-[var(--accent-active-border)] bg-transparent px-3.5 py-3 font-mono text-base outline-none focus:border-[var(--tab-active)] focus:ring-3 focus:ring-[var(--accent-active-soft)] dark:border-white/15'
const LABEL = 'text-xs font-semibold text-gray-700 dark:text-gray-300'
const ERROR = 'm-0 text-sm text-[var(--accent-down)] dark:text-red-400'

/** Shares, price per share and optional purchase date of one buy lot. */
export function LotForm({
  currency,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  currency: string | null
  initial?: PortfolioLot
  submitLabel: string
  onSubmit: (input: LotInput) => Promise<void>
  onCancel?: () => void
}) {
  const [sharesIn, setSharesIn] = useState(initial ? String(initial.shares) : '')
  const [priceIn, setPriceIn] = useState(initial ? String(initial.price) : '')
  const [dateIn, setDateIn] = useState(initial?.purchased_on ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sh = parseDecimal(sharesIn)
  const price = parseDecimal(priceIn)
  const today = localToday()
  // ISO dates compare correctly as strings.
  const badDate = dateIn !== '' && (dateIn < EARLIEST_DATE || dateIn > today)
  const ok = sh > 0 && price > 0 && !badDate
  const invalidNumber =
    (sharesIn.trim() !== '' && !(sh > 0)) || (priceIn.trim() !== '' && !(price > 0))
  const ambiguous = [sharesIn, priceIn].find(isAmbiguousDecimal)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!ok || busy) return
    setBusy(true)
    setError(null)
    try {
      await onSubmit({ shares: sh, price, purchased_on: dateIn || null })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={submit}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Shares</span>
          <input
            autoFocus
            inputMode="decimal"
            placeholder="0"
            value={sharesIn}
            onChange={(e) => setSharesIn(e.target.value)}
            className={INPUT}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Price per share{currency ? ` (${currency})` : ''}</span>
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={priceIn}
            onChange={(e) => setPriceIn(e.target.value)}
            className={INPUT}
          />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={LABEL}>
            Purchase date <span className="font-normal text-gray-500">(optional)</span>
          </span>
          <input
            type="date"
            min={EARLIEST_DATE}
            max={today}
            value={dateIn}
            onChange={(e) => setDateIn(e.target.value)}
            className={INPUT}
          />
        </label>
      </div>
      {!currency && (
        <p className="m-0 text-xs text-gray-500 dark:text-gray-400">
          Enter the price in the currency the stock trades in (e.g. USD for NASDAQ, EUR for
          Helsinki).
        </p>
      )}
      {invalidNumber && (
        <p className={ERROR}>
          {ambiguous
            ? `Ambiguous — type ${Number(ambiguous.trim().replace(',', ''))} or ${ambiguous.trim().replace(',', '.')}`
            : 'Enter positive numbers, e.g. 12 or 12.5'}
        </p>
      )}
      {badDate && <p className={ERROR}>Enter a purchase date between 1900 and today</p>}
      <div className="flex justify-between border-t border-dashed border-[var(--accent-active-border)] pt-3 text-sm">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Cost basis
        </span>
        <b className="font-mono">{sh > 0 && price > 0 ? money(sh * price, currency, 2) : '—'}</b>
      </div>
      {error && (
        <p role="alert" className={ERROR}>
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-full border border-[var(--accent-active-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--accent-active-soft)] dark:border-white/15"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!ok || busy}
          className="cursor-pointer rounded-full bg-[var(--primary-button-background)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-button-hover)] disabled:cursor-default disabled:bg-gray-300 dark:disabled:bg-gray-600"
        >
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
