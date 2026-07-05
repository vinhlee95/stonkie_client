'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Clock3, Sparkles } from 'lucide-react'
import type { TickerRecapItem, TickerRecapCadence } from '@/lib/api/tickerRecap'
import SourceChip from './SourceChip'

interface TickerRecapCardProps {
  symbol: string
  daily: TickerRecapItem | null
  weekly: TickerRecapItem | null
}

function bulletColor(index: number): string {
  const palette = ['bg-blue-600', 'bg-amber-600', 'bg-rose-600', 'bg-emerald-700']
  return palette[index % palette.length]!
}

function formatRecapCreatedAt(createdAt: string | null): string {
  if (!createdAt) return ''
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return createdAt
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatRecapPeriod(periodStart: string, periodEnd: string): string {
  const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
  const start = new Date(`${periodStart}T00:00:00Z`)
  const end = new Date(`${periodEnd}T00:00:00Z`)
  if (Number.isNaN(start.getTime())) return periodStart
  if (periodStart === periodEnd || Number.isNaN(end.getTime())) return fmt.format(start)
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

export default function TickerRecapCard({ symbol, daily, weekly }: TickerRecapCardProps) {
  const initialCadence: TickerRecapCadence = daily ? 'daily' : 'weekly'
  const [cadence, setCadence] = useState<TickerRecapCadence>(initialCadence)
  const [expanded, setExpanded] = useState(true)

  const recap = cadence === 'daily' ? (daily ?? weekly) : (weekly ?? daily)
  const showCadenceToggle = Boolean(daily && weekly)

  const cadenceTabRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [cadenceIndicator, setCadenceIndicator] = useState({ left: 0, width: 0 })
  useEffect(() => {
    if (!showCadenceToggle) return
    const activeIndex = cadence === 'daily' ? 0 : 1
    const el = cadenceTabRefs.current[activeIndex]
    if (el) setCadenceIndicator({ left: el.offsetLeft, width: el.offsetWidth })
  }, [cadence, showCadenceToggle])

  const formattedCreatedAt = useMemo(
    () => (recap ? formatRecapCreatedAt(recap.created_at) : ''),
    [recap],
  )
  const formattedPeriod = useMemo(
    () => (recap ? formatRecapPeriod(recap.period_start, recap.period_end) : ''),
    [recap],
  )
  const sourceById = useMemo(() => {
    return new Map((recap?.sources ?? []).map((source) => [source.id, source]))
  }, [recap])

  if (!recap) return null

  return (
    <section
      aria-label={`${symbol} recap`}
      className="rounded-2xl border border-[rgba(40,105,86,0.13)] bg-[var(--button-background)] dark:bg-[var(--button-background-dark)] overflow-hidden"
    >
      {/* Header / toggle row — always visible */}
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] px-2.5 py-1">
            <span
              aria-hidden="true"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-active)]/15 dark:bg-[var(--accent-active-dark)]/20 text-[var(--accent-active)] dark:text-[var(--accent-active-dark)]"
            >
              <Sparkles size={12} strokeWidth={2} />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-[0.11em] text-[var(--accent-active)] dark:text-[var(--accent-active-dark)]">
              {symbol} Recap
            </span>
          </div>

          {showCadenceToggle && (
            <div
              role="group"
              aria-label="Recap cadence"
              className="relative inline-flex items-center bg-gray-100/80 dark:bg-gray-800/40 backdrop-blur-sm rounded-full p-1 gap-1"
            >
              <div
                aria-hidden="true"
                className="absolute top-1 bottom-1 rounded-full bg-white dark:bg-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
                style={{
                  left: `${cadenceIndicator.left}px`,
                  width: `${cadenceIndicator.width}px`,
                }}
              />
              {(['daily', 'weekly'] as const).map((value, index) => {
                const active = cadence === value
                return (
                  <span
                    key={value}
                    ref={(el) => {
                      cadenceTabRefs.current[index] = el
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={active}
                    onClick={() => setCadence(value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setCadence(value)
                      }
                    }}
                    className={`relative z-10 px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-300 cursor-pointer select-none whitespace-nowrap ${
                      active
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {value === 'daily' ? 'Daily' : 'Weekly'}
                  </span>
                )
              })}
            </div>
          )}

          <button
            type="button"
            aria-label={expanded ? 'Collapse recap' : 'Expand recap'}
            aria-expanded={expanded}
            onClick={() => setExpanded((prev) => !prev)}
            className="ml-auto p-1 -mr-1 text-[var(--accent-active)] dark:text-[var(--accent-active-dark)] cursor-pointer"
          >
            <span
              className={`inline-block transition-transform duration-300 ${expanded ? '' : 'rotate-180'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline
                  points="18 15 12 9 6 15"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>

        {/* Period chip */}
        <div className="mt-3">
          <span
            aria-label={`Recap period ${formattedPeriod}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(40,105,86,0.25)] dark:border-[rgba(156,214,194,0.35)] px-2 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap"
          >
            <CalendarDays aria-hidden="true" size={12} strokeWidth={2.1} />
            <span className="whitespace-nowrap">{formattedPeriod}</span>
          </span>
        </div>

        {/* Summary */}
        <p className="mt-3 text-base md:text-lg leading-6 md:leading-7 text-gray-700 dark:text-gray-200">
          {recap.summary}
        </p>

        {/* Curated timestamp */}
        {formattedCreatedAt && (
          <div className="mt-2.5">
            <span
              aria-label={`Recap created ${formattedCreatedAt}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(40,105,86,0.25)] dark:border-[rgba(156,214,194,0.35)] px-2 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap"
            >
              <Clock3 aria-hidden="true" size={12} strokeWidth={2.1} />
              <span className="whitespace-nowrap">Curated on: {formattedCreatedAt}</span>
            </span>
          </div>
        )}
      </div>

      {/* Bullets — collapsible */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            <div className="h-px bg-[rgba(40,105,86,0.12)] mb-3.5" />
            <div className="space-y-3">
              {recap.bullets.map((bullet, bulletIndex) => (
                <div key={`${bullet.text}-${bulletIndex}`} className="flex items-start gap-2.5">
                  <span
                    className={`mt-2 h-2 w-2 shrink-0 rounded-full ring-2 ring-white dark:ring-black/25 ${bulletColor(
                      bulletIndex,
                    )}`}
                  />
                  <div className="flex-1 text-base md:text-lg leading-6 md:leading-7 text-gray-700 dark:text-gray-200">
                    <span>{bullet.text}</span>
                    {bullet.citations.map((citation, citationIndex) => {
                      const source = sourceById.get(citation.source_id)
                      if (!source?.url) return null
                      const citationKey = `${bulletIndex}-${citation.source_id}-${citationIndex}`
                      return (
                        <span key={citationKey} className="ml-1.5 inline-flex">
                          <SourceChip
                            source={{
                              url: source.url,
                              title: source.title,
                              publisher: source.publisher,
                              publishedAt: source.published_at,
                            }}
                          />
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
