'use client'

import { useState, type ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { LotInput, PortfolioLot } from '@/lib/api/portfolio'
import { money, priceDp, purchaseDate, shares } from '../format'
import { LotForm } from './LotForm'

/** A position's lots; each row edits inline or deletes after a confirm. */
export function LotList({
  lots,
  currency,
  onUpdate,
  onDelete,
}: {
  lots: PortfolioLot[]
  currency: string | null
  onUpdate: (id: string, input: LotInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState<string | null>(null)
  return (
    <ul aria-label="Lots" className="m-0 flex list-none flex-col p-0">
      {lots.map((lot, i) => (
        <li key={lot.id} className={i ? 'border-t border-gray-100 dark:border-white/10' : ''}>
          {editing === lot.id ? (
            <div className="py-3">
              <LotForm
                currency={currency}
                initial={lot}
                submitLabel="Save lot"
                onCancel={() => setEditing(null)}
                onSubmit={async (input) => {
                  await onUpdate(lot.id, input)
                  setEditing(null)
                }}
              />
            </div>
          ) : (
            <LotRow
              lot={lot}
              currency={currency}
              onEdit={() => setEditing(lot.id)}
              onDelete={() => onDelete(lot.id)}
            />
          )}
        </li>
      ))}
    </ul>
  )
}

function LotRow({
  lot,
  currency,
  onEdit,
  onDelete,
}: {
  lot: PortfolioLot
  currency: string | null
  onEdit: () => void
  onDelete: () => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async () => {
    setBusy(true)
    setError(null)
    try {
      await onDelete()
      setConfirming(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-1 py-2.5">
      <div className="flex items-center gap-3 text-sm">
        <span className="w-24 shrink-0 text-gray-500 dark:text-gray-400">
          {lot.purchased_on ? purchaseDate(lot.purchased_on) : 'No date'}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono">
          {shares(lot.shares)} × {money(lot.price, currency, priceDp(lot.price))}
        </span>
        <b className="font-mono">{money(lot.shares * lot.price, currency, 2)}</b>
        {confirming ? (
          <span className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void remove()}
              className="cursor-pointer font-semibold text-[var(--accent-down)] disabled:opacity-50 dark:text-red-400"
            >
              {busy ? 'Deleting…' : 'Delete'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirming(false)}
              className="cursor-pointer font-semibold disabled:opacity-50"
            >
              Keep
            </button>
          </span>
        ) : (
          <span className="flex items-center">
            <IconButton label="Edit lot" onClick={onEdit}>
              <Pencil size={15} />
            </IconButton>
            <IconButton label="Delete lot" onClick={() => setConfirming(true)}>
              <Trash2 size={15} />
            </IconButton>
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="m-0 text-sm text-[var(--accent-down)] dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
    >
      {children}
    </button>
  )
}
