'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TickerRecapItem, TickerRecapCadence } from '@/lib/api/tickerRecap'
import SourceChip from './SourceChip'
import RecapCuratedChip from './RecapCuratedChip'

interface TickerRecapCardProps {
  symbol: string
  daily: TickerRecapItem | null
  weekly: TickerRecapItem | null
}

// Quiet companion layout: summary + the top insights show; the rest collapse
// behind a "Show more" link so the recap reads as a calm secondary panel next
// to the price chart.
const VISIBLE_BULLETS = 2

function bulletColor(index: number): string {
  const palette = ['bg-blue-600', 'bg-amber-600', 'bg-rose-600', 'bg-emerald-700']
  return palette[index % palette.length]!
}

export default function TickerRecapCard({ symbol, daily, weekly }: TickerRecapCardProps) {
  const initialCadence: TickerRecapCadence = daily ? 'daily' : 'weekly'
  const [cadence, setCadence] = useState<TickerRecapCadence>(initialCadence)
  const [expanded, setExpanded] = useState(false)

  const recap = cadence === 'daily' ? (daily ?? weekly) : (weekly ?? daily)
  const showCadenceToggle = Boolean(daily && weekly)

  const sourceById = useMemo(() => {
    return new Map((recap?.sources ?? []).map((source) => [source.id, source]))
  }, [recap])

  // The insight list scrolls inside a locked-height column on desktop; show a
  // soft bottom fade only while there is more to reveal below the fold.
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const updateFade = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 1)
  }, [])
  useEffect(() => {
    updateFade()
    window.addEventListener('resize', updateFade)
    return () => window.removeEventListener('resize', updateFade)
  }, [updateFade, expanded, cadence, recap])

  if (!recap) return null

  const bullets = recap.bullets
  const visibleBullets = expanded ? bullets : bullets.slice(0, VISIBLE_BULLETS)
  const hiddenCount = bullets.length - VISIBLE_BULLETS

  return (
    <section aria-label={`${symbol} recap`} className="flex h-full flex-col lg:absolute lg:inset-0">
      {/* Fixed header block — never scrolls */}
      <div className="shrink-0">
        {/* Header row: label + cadence toggle */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-[7px] w-[7px] rounded-full bg-[var(--accent-active)] dark:bg-[var(--accent-active-dark)]"
            />
            <span className="text-xs font-extrabold uppercase tracking-[0.11em] text-[var(--accent-active)] dark:text-[var(--accent-active-dark)]">
              {symbol} Recap
            </span>
          </div>

          {showCadenceToggle && (
            <div
              role="group"
              aria-label="Recap cadence"
              className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-gray-100 p-1 dark:bg-gray-800/50"
            >
              {(['daily', 'weekly'] as const).map((value) => {
                const active = cadence === value
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCadence(value)}
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                        : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    {value === 'daily' ? 'Daily' : 'Weekly'}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Curated meta — shared pill */}
        <RecapCuratedChip createdAt={recap.created_at} className="mt-2" />

        {/* Summary */}
        <p className="mt-2.5 text-base leading-6 text-gray-700 md:text-lg md:leading-7 dark:text-gray-200">
          {recap.summary}
        </p>

        {/* Divider */}
        <div className="my-3.5 h-px bg-[rgba(40,105,86,0.12)] dark:bg-[rgba(156,214,194,0.18)]" />
      </div>

      {/* Insights — scroll inside the locked row height on desktop */}
      <div className="relative lg:min-h-0 lg:flex-1">
        <div
          ref={scrollRef}
          onScroll={updateFade}
          className={`lg:h-full ${expanded ? 'lg:overflow-y-auto lg:pr-1' : 'lg:overflow-hidden'}`}
        >
          <div className="space-y-3">
            {visibleBullets.map((bullet, bulletIndex) => (
              <div key={`${bullet.text}-${bulletIndex}`} className="flex items-start gap-2.5">
                <span
                  className={`mt-2 h-2 w-2 shrink-0 rounded-full ring-2 ring-white dark:ring-black/25 ${bulletColor(
                    bulletIndex,
                  )}`}
                />
                <div className="flex-1 text-base leading-6 text-gray-700 md:text-lg md:leading-7 dark:text-gray-200">
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

        {/* Soft bottom fade — desktop only, while more insights sit below */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 hidden h-10 bg-gradient-to-t from-[var(--background)] to-transparent transition-opacity duration-200 lg:block ${
            expanded && canScrollDown ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* Show more / less */}
      {hiddenCount > 0 && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-3.5 inline-flex shrink-0 cursor-pointer items-center gap-1.5 self-start text-sm font-semibold text-[var(--accent-active)] dark:text-[var(--accent-active-dark)]"
        >
          {expanded
            ? 'Show less'
            : `Show ${hiddenCount} more insight${hiddenCount === 1 ? '' : 's'}`}
          <span
            className={`inline-block transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline
                points="6 9 12 15 18 9"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      )}
    </section>
  )
}
