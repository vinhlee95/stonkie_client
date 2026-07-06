import { Clock3 } from 'lucide-react'

/** Locale-aware "medium date + short time" (e.g. "3 Jul 2026, 05:00"). Falls back to raw input. */
export function formatRecapCreatedAt(createdAt: string): string {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return createdAt
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

interface RecapCuratedChipProps {
  /** ISO timestamp of when the recap was curated. Renders nothing when null/empty. */
  createdAt: string | null | undefined
  /** Extra classes (e.g. margins) appended to the chip. */
  className?: string
}

/**
 * Shared "Curated on: {date, time}" pill rendered under every recap surface
 * (market recap, ticker recap, chat recap detail, favourite card). Keeps the
 * curated timestamp visually identical everywhere.
 */
export default function RecapCuratedChip({ createdAt, className = '' }: RecapCuratedChipProps) {
  if (!createdAt) return null
  const formatted = formatRecapCreatedAt(createdAt)
  return (
    <span
      aria-label={`Recap curated ${formatted}`}
      className={`inline-flex w-fit items-center gap-1 rounded-full border border-[rgba(40,105,86,0.25)] px-2 py-1 text-[11px] font-medium text-gray-600 dark:border-[rgba(156,214,194,0.35)] dark:text-gray-300 ${className}`}
    >
      <Clock3 aria-hidden="true" size={11} strokeWidth={2.25} />
      <span>Curated on: {formatted}</span>
    </span>
  )
}
