'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CalendarDays, Clock3, Sparkles } from 'lucide-react'
import { MarketRecapItem } from '@/lib/api/marketRecap'
import SourceChip from './SourceChip'

type Cadence = 'daily' | 'weekly'

interface MarketRecapCardProps {
  daily: MarketRecapItem | null
  weekly: MarketRecapItem | null
  onDigDeeper?: () => void
}

function bulletColor(index: number): string {
  const palette = ['bg-blue-600', 'bg-amber-600', 'bg-rose-600', 'bg-emerald-700']
  return palette[index % palette.length]!
}

function formatRecapCreatedAt(createdAt: string): string {
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

export default function MarketRecapCard({ daily, weekly, onDigDeeper }: MarketRecapCardProps) {
  const initialCadence: Cadence = daily ? 'daily' : 'weekly'
  const [cadence, setCadence] = useState<Cadence>(initialCadence)
  const [expanded, setExpanded] = useState(false)

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

  const teaser = useMemo(() => recap?.summary.trim() ?? '', [recap])
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
      aria-label="Market recap"
      className="rounded-2xl border border-[rgba(40,105,86,0.13)] bg-[var(--button-background)] dark:bg-[var(--button-background-dark)] overflow-visible"
    >
      <button
        type="button"
        className="w-full text-left px-4 py-3 cursor-pointer"
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] px-2.5 py-1">
                <span
                  aria-hidden="true"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-active)]/15 dark:bg-[var(--accent-active-dark)]/20 text-[var(--accent-active)] dark:text-[var(--accent-active-dark)]"
                >
                  <Sparkles size={12} strokeWidth={2} />
                </span>
                <span className="text-xs font-extrabold uppercase tracking-[0.11em] text-[var(--accent-active)] dark:text-[var(--accent-active-dark)]">
                  Market Recap
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
                        onClick={(event) => {
                          event.stopPropagation()
                          setCadence(value)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            event.stopPropagation()
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
              <span
                aria-label={`Recap period ${formattedPeriod}`}
                className="inline-flex items-center gap-1 rounded-full border border-[rgba(40,105,86,0.25)] dark:border-[rgba(156,214,194,0.35)] px-2 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 w-fit"
              >
                <CalendarDays aria-hidden="true" size={11} strokeWidth={2.25} />
                <span>{formattedPeriod}</span>
              </span>
            </div>
            <p
              className={`mt-1.5 text-base md:text-lg leading-6 md:leading-7 text-gray-700 dark:text-gray-200 ${
                expanded ? '' : 'line-clamp-6 md:line-clamp-none'
              }`}
            >
              {teaser}
            </p>
            <span
              aria-label={`Recap created ${formattedCreatedAt}`}
              className="mt-2 inline-flex w-fit items-center gap-1 rounded-full border border-[rgba(40,105,86,0.25)] dark:border-[rgba(156,214,194,0.35)] px-2 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-300"
            >
              <Clock3 aria-hidden="true" size={11} strokeWidth={2.25} />
              <span>Curated on: {formattedCreatedAt}</span>
            </span>
          </div>
          <span
            aria-hidden="true"
            className={`mt-1 text-[var(--accent-active)] dark:text-[var(--accent-active-dark)] transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline
                points="6 9 12 15 18 9"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="h-px bg-[rgba(40,105,86,0.1)] mb-3" />
          <div className="space-y-2">
            {recap.bullets.map((bullet, bulletIndex) => (
              <div key={`${bullet.text}-${bulletIndex}`} className="flex items-start gap-2.5 pb-2">
                <span
                  className={`mt-2 h-2 w-2 shrink-0 rounded-full ring-1 ring-white/70 dark:ring-black/25 ${bulletColor(
                    bulletIndex,
                  )}`}
                />
                <div className="text-base md:text-lg leading-6 md:leading-7 text-gray-700 dark:text-gray-200">
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

          {onDigDeeper && (
            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDigDeeper()
                }}
                className="pulse-ring inline-flex items-center gap-2 rounded-full bg-[var(--accent-active)] dark:bg-[var(--accent-active-dark)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)] dark:hover:bg-[var(--accent-hover-dark)] cursor-pointer"
              >
                <Sparkles size={15} strokeWidth={2.4} />
                Dig deeper
                <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
