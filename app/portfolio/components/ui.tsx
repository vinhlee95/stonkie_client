import type { ReactNode } from 'react'
import { tone, TONE_TEXT } from '../format'

export function Card({
  title,
  right,
  children,
  className = '',
  pad = true,
}: {
  title?: ReactNode
  right?: ReactNode
  children: ReactNode
  className?: string
  pad?: boolean
}) {
  return (
    <section
      className={`min-w-0 rounded-2xl border border-[var(--accent-active-border)] bg-[var(--card-background)] dark:border-white/10 ${className}`}
    >
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 pt-3.5 md:px-[18px] md:pt-4">
          <h3 className="m-0 text-base font-bold">{title}</h3>
          {right}
        </header>
      )}
      <div className={pad ? 'px-3.5 pb-3.5 pt-3 md:px-[18px] md:pb-[18px] md:pt-3.5' : ''}>
        {children}
      </div>
    </section>
  )
}

export function SampleBadge() {
  return (
    <span
      title="Placeholder until this data is connected"
      className="whitespace-nowrap rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:border-gray-600 dark:text-gray-400"
    >
      Sample data
    </span>
  )
}

export function DelayedTag() {
  return (
    <span
      title="Live price unavailable — showing last close"
      className="whitespace-nowrap rounded-full border border-gray-300 px-1.5 text-[10px] font-semibold text-gray-500 dark:border-gray-600 dark:text-gray-400"
    >
      delayed
    </span>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">
      {children}
    </div>
  )
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
  small,
  label,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  small?: boolean
  label: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex gap-0.5 rounded-full bg-[var(--button-background)] ${small ? 'p-[3px]' : 'p-1'}`}
    >
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={o === value}
          onClick={() => onChange(o)}
          className={`cursor-pointer rounded-full font-semibold ${
            small ? 'px-2 py-1 text-[11.5px]' : 'px-4 py-1.5 text-sm'
          } ${
            o === value
              ? 'bg-white text-gray-900 shadow-sm dark:bg-[var(--card-background)] dark:text-gray-100'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export function Delta({
  v,
  children,
  className = '',
}: {
  v: number
  children: ReactNode
  className?: string
}) {
  return (
    <span className={`font-mono tabular-nums ${TONE_TEXT[tone(v)]} ${className}`}>
      {v >= 0 ? '▲' : '▼'} {children}
    </span>
  )
}

const LOGO_COLORS = [
  '#286956',
  '#0a66c2',
  '#6b2c91',
  '#b45309',
  '#be123c',
  '#0f766e',
  '#334155',
  '#4d7c0f',
]

export function TickerLogo({ ticker, size = 32 }: { ticker: string; size?: number }) {
  const seed = [...ticker].reduce((a, c) => a + c.charCodeAt(0), 0)
  return (
    <span
      aria-hidden
      className="inline-flex flex-none items-center justify-center rounded-full font-extrabold text-white"
      style={{
        width: size,
        height: size,
        background: LOGO_COLORS[seed % LOGO_COLORS.length],
        fontSize: size * 0.42,
      }}
    >
      {ticker[0]}
    </span>
  )
}

export function Sparkline({
  data,
  w = 72,
  h = 24,
  up,
}: {
  data: number[]
  w?: number
  h?: number
  up: boolean
}) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const r = max - min || 1
  const d = data
    .map(
      (v, i) =>
        `${i ? 'L' : 'M'}${((i / (data.length - 1)) * w).toFixed(1)} ${(h - 2 - ((v - min) / r) * (h - 4)).toFixed(1)}`,
    )
    .join(' ')
  const color = up ? 'var(--tab-active)' : 'var(--accent-down)'
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block flex-none" aria-hidden>
      <path d={`${d} L${w} ${h} L0 ${h}Z`} fill={color} opacity="0.08" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
