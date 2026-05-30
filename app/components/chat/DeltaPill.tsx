'use client'

interface DeltaPillProps {
  delta: number | null
}

export default function DeltaPill({ delta }: DeltaPillProps) {
  if (delta == null) return null

  const up = delta >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
        up ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
      }`}
    >
      {up ? '+' : ''}
      {delta}%
    </span>
  )
}
