'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Clock3, Sparkles } from 'lucide-react'
import { MarketRecapItem } from '@/lib/api/marketRecap'

type Cadence = 'daily' | 'weekly'

interface MarketRecapCardProps {
  daily: MarketRecapItem | null
  weekly: MarketRecapItem | null
}

function bulletColor(index: number): string {
  const palette = ['bg-blue-600', 'bg-amber-600', 'bg-rose-600', 'bg-emerald-700']
  return palette[index % palette.length]!
}

function normalizeSourceSiteLabel(raw: string): string {
  const knownBrands: Record<string, string> = {
    'reuters.com': 'Reuters',
    'marketwatch.com': 'MarketWatch',
    'cnbc.com': 'CNBC',
    'bloomberg.com': 'Bloomberg',
    'wsj.com': 'WSJ',
    'ft.com': 'FT',
  }

  let normalized = raw.trim()
  if (!normalized) return 'Source'

  if (!normalized.includes('://') && normalized.includes('.')) {
    normalized = `https://${normalized}`
  }

  try {
    const host = new URL(normalized).hostname.replace(/^www\./, '').toLowerCase()
    if (knownBrands[host]) return knownBrands[host]
    const [root] = host.split('.')
    if (!root) return 'Source'
    return root.charAt(0).toUpperCase() + root.slice(1)
  } catch {
    const lowercase = normalized.toLowerCase()
    for (const [domain, brand] of Object.entries(knownBrands)) {
      if (lowercase.includes(domain)) return brand
    }
    return normalized
  }
}

function sourceLabel(source: { publisher: string; url: string }): string {
  const publisher = source.publisher?.trim()
  if (publisher) return normalizeSourceSiteLabel(publisher)

  try {
    return normalizeSourceSiteLabel(source.url)
  } catch {
    return 'Source'
  }
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

export default function MarketRecapCard({ daily, weekly }: MarketRecapCardProps) {
  const initialCadence: Cadence = daily ? 'daily' : 'weekly'
  const [cadence, setCadence] = useState<Cadence>(initialCadence)
  const [expanded, setExpanded] = useState(false)
  const [hoveredCitationKey, setHoveredCitationKey] = useState<string | null>(null)
  const [hoveredTooltipAlign, setHoveredTooltipAlign] = useState<'left' | 'right'>('left')

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
                expanded ? '' : 'line-clamp-3'
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
                      <span
                        key={citationKey}
                        className="relative ml-1.5 inline-flex"
                        onMouseEnter={(event) => {
                          const rect = event.currentTarget.getBoundingClientRect()
                          const estimatedTooltipWidth = 320
                          const viewportPadding = 16
                          const spaceOnRight = window.innerWidth - rect.left

                          setHoveredTooltipAlign(
                            spaceOnRight < estimatedTooltipWidth + viewportPadding
                              ? 'right'
                              : 'left',
                          )
                          setHoveredCitationKey(citationKey)
                        }}
                        onMouseLeave={() =>
                          setHoveredCitationKey((current) =>
                            current === citationKey ? null : current,
                          )
                        }
                        onFocus={(event) => {
                          const rect = event.currentTarget.getBoundingClientRect()
                          const estimatedTooltipWidth = 320
                          const viewportPadding = 16
                          const spaceOnRight = window.innerWidth - rect.left

                          setHoveredTooltipAlign(
                            spaceOnRight < estimatedTooltipWidth + viewportPadding
                              ? 'right'
                              : 'left',
                          )
                          setHoveredCitationKey(citationKey)
                        }}
                        onBlur={() =>
                          setHoveredCitationKey((current) =>
                            current === citationKey ? null : current,
                          )
                        }
                      >
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="
                            inline-flex items-center
                            py-0.5 px-2 text-xs font-medium rounded-full transition-all
                            bg-[var(--button-background)] dark:bg-[var(--button-background-dark)]
                            text-gray-700 dark:text-gray-200 hover:bg-[var(--accent-hover)] dark:hover:bg-[var(--accent-hover-dark)]
                            border border-[var(--accent-active)] dark:border-[var(--accent-active-dark)]
                          "
                        >
                          {sourceLabel(source)}
                        </a>

                        {hoveredCitationKey === citationKey && (
                          <div
                            role="tooltip"
                            className="
                              absolute top-[calc(100%+8px)] z-30 w-80 max-w-[calc(100vw-2rem)]
                              rounded-lg border border-gray-200 dark:border-gray-700
                              bg-white dark:bg-gray-900 shadow-lg p-3
                            "
                            style={hoveredTooltipAlign === 'right' ? { right: 0 } : { left: 0 }}
                          >
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-semibold">Website:</span> {sourceLabel(source)}
                            </p>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-semibold">Title:</span> {source.title}
                            </p>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-semibold">Publisher:</span>{' '}
                              {source.publisher?.trim() || sourceLabel(source)}
                            </p>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-semibold">Published at:</span>{' '}
                              {source.published_at}
                            </p>
                          </div>
                        )}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-2 w-full rounded-xl bg-[var(--accent-active)] dark:bg-[var(--accent-active-dark)] text-white dark:text-black px-3 py-2.5 text-base md:text-lg font-semibold flex items-center gap-2 cursor-default"
            aria-label="Ask about this market"
          >
            <span aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="flex-1 text-left">Ask about this market</span>
            <span aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2.5" strokeLinecap="round" />
                <polyline
                  points="12 5 19 12 12 19"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>
      )}
    </section>
  )
}
