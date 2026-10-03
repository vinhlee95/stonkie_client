'use client'

import { useMemo, useRef, useState } from 'react'
import type { PortfolioHolding, PortfolioSummary as Summary } from '@/lib/api/portfolio'
import { money, pct, plural, signedMoney, tone, TONE_TEXT } from '../format'
import {
  backTestNote,
  RANGE_KEYS,
  rangeReturn,
  sliceAndRebase,
  tickStep,
  type PerformanceState,
  type RangeKey,
} from '../performance'
import {
  SAMPLE_DIV_MONTHS,
  SAMPLE_DIV_PAYERS,
  SAMPLE_DIV_RECEIVED,
  SAMPLE_EVENTS,
  SAMPLE_NEWS,
  SAMPLE_RISK,
} from '../sampleData'
import { Card, Delta, Label, SampleBadge, Seg, TickerLogo } from './ui'

type Priced = PortfolioHolding & { value: number; weight: number }

export function pricedHoldings(holdings: PortfolioHolding[]): Priced[] {
  return holdings.filter((h): h is Priced => h.value !== null && h.weight !== null)
}

/* ── Summary ─────────────────────────────── */
export function PortfolioSummary({
  s,
  currency,
  range,
  performance,
}: {
  s: Summary
  currency: string
  range: RangeKey
  performance: PerformanceState
}) {
  // All = real return vs average cost; other ranges back-test current holdings.
  const ret =
    range === 'All'
      ? { abs: s.total_return, pct: s.total_return_percent }
      : performance.points
        ? rangeReturn(performance.points, range)
        : null
  const loading = range !== 'All' && performance.status === 'pending'
  return (
    <div className="mb-3.5 flex flex-col gap-3.5 md:mb-[18px] md:flex-row md:items-end md:justify-between md:gap-6">
      <div>
        <Label>Total value · {currency}</Label>
        <div className="mt-1 font-mono text-[32px] font-bold leading-tight tracking-tight tabular-nums md:text-[38px]">
          {money(s.total_value, currency)}
        </div>
        <div className="mt-1 flex items-center gap-2 text-base">
          <Delta v={s.day_change}>
            {signedMoney(s.day_change, currency)} ({pct(s.day_change_percent)})
          </Delta>
          <span className="text-sm text-gray-500 dark:text-gray-400">today</span>
        </div>
      </div>
      <div className="flex justify-between gap-0 border-t border-gray-100 pt-3 md:gap-7 md:border-0 md:pt-0 dark:border-white/10">
        <div
          title={
            range === 'All'
              ? 'Since purchase, vs your average cost'
              : backTestNote(performance.excluded)
          }
        >
          <Label>Return</Label>
          {loading ? (
            <div aria-label="Loading return" className="mt-1 flex flex-col gap-1.5">
              <div className="h-[18px] w-24 animate-pulse rounded bg-gray-100 dark:bg-white/10 md:h-[22px]" />
              <div className="h-3 w-12 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
            </div>
          ) : ret ? (
            <>
              <div
                className={`mt-1 font-mono text-[15px] font-bold tabular-nums md:text-lg ${TONE_TEXT[tone(ret.abs)]}`}
              >
                {signedMoney(ret.abs, currency, 0)}
              </div>
              <div className={`mt-0.5 font-mono text-xs ${TONE_TEXT[tone(ret.abs)]}`}>
                {pct(ret.pct)}
              </div>
            </>
          ) : (
            <div className="mt-1 font-mono text-[15px] font-bold text-gray-400 md:text-lg">—</div>
          )}
        </div>
        <div>
          <Label>Invested</Label>
          <div className="mt-1 font-mono text-[15px] font-bold tabular-nums md:text-lg">
            {money(s.total_cost, currency, 0)}
          </div>
          <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {plural(s.holdings_count, 'holding')}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Performance vs S&P 500 ──────────────── */
export function PerformanceChart({
  height = 250,
  compact,
  range,
  onRangeChange,
  performance,
}: {
  height?: number
  compact?: boolean
  range: RangeKey
  onRangeChange: (range: RangeKey) => void
  performance: PerformanceState
}) {
  const [hover, setHover] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const { points, excluded, status } = performance
  const data = useMemo(() => (points ? sliceAndRebase(points, range) : []), [points, range])
  const ready = data.length >= 2

  const W = 1000
  const H = height
  // Hover re-renders on every mousemove; keep the O(n) geometry out of that path.
  const { lo, hi, ticks, pPath, bPath } = useMemo(() => {
    if (data.length < 2) return { lo: 0, hi: 1, ticks: [], pPath: '', bPath: '' }
    const all = data.flatMap((pt) => [pt.p, pt.b])
    const pad = (Math.max(...all) - Math.min(...all)) * 0.12 || 1
    const lo = Math.min(...all) - pad
    const hi = Math.max(...all) + pad
    const px = (i: number) => (i / (data.length - 1)) * W
    const py = (v: number) => H - ((v - lo) / (hi - lo)) * H
    const path = (k: 'p' | 'b') =>
      data.map((pt, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${py(pt[k]).toFixed(1)}`).join(' ')
    const step = tickStep(hi - lo, H)
    const ticks: number[] = []
    for (let t = Math.ceil(lo / step) * step; t < hi; t += step) ticks.push(t)
    return { lo, hi, ticks, pPath: path('p'), bPath: path('b') }
  }, [data, H])
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H
  const x = (i: number) => (i / (data.length - 1)) * W
  const last = ready ? data[data.length - 1] : null
  // A hover index from a longer range can point past the end of this one.
  const cur = (hover != null && data[hover]) || last
  const fmtD = (d: Date) =>
    d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: range === 'All' || range === '1Y' ? '2-digit' : undefined,
      timeZone: 'UTC',
    })
  const onMove = (e: React.MouseEvent) => {
    if (!ready) return
    const r = ref.current!.getBoundingClientRect()
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    setHover(Math.round(f * (data.length - 1)))
  }
  const message =
    status === 'error'
      ? "Couldn't load performance history."
      : status === 'success' && !points?.length
        ? 'No price history available for your holdings yet.'
        : status === 'success' && !ready
          ? 'Not enough history for this range yet.'
          : null

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        {/* Hover changes these values every frame: fixed widths keep the header from
            re-wrapping, which would shift the plot under the cursor and make it jitter. */}
        <div className="flex flex-wrap items-center gap-4 whitespace-nowrap text-[12.5px]">
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-[3px] w-3.5 rounded-sm bg-[var(--tab-active)]" />
            Portfolio
            <b
              className={`inline-block min-w-[7ch] font-mono ${cur ? TONE_TEXT[tone(cur.p)] : ''}`}
            >
              {cur ? pct(cur.p, 1) : '—'}
            </b>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-[3px] w-3.5 bg-[repeating-linear-gradient(90deg,#9aa19d_0_4px,transparent_4px_7px)]" />
            S&amp;P 500{' '}
            <b className="inline-block min-w-[7ch] font-mono">{cur ? pct(cur.b, 1) : '—'}</b>
          </span>
          {!compact && (
            <span className="inline-block w-[23ch] text-gray-500 dark:text-gray-400">
              {cur &&
                (hover != null
                  ? fmtD(cur.d)
                  : `${pct(cur.p - cur.b, 1).replace('%', ' pts')} vs benchmark`)}
            </span>
          )}
        </div>
        <Seg
          small
          label="Range"
          options={RANGE_KEYS}
          value={range}
          onChange={(r) => {
            onRangeChange(r)
            setHover(null)
          }}
        />
      </div>
      {!ready ? (
        message ? (
          <div
            className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-500 dark:border-white/10 dark:text-gray-400"
            style={{ height }}
          >
            {message}
          </div>
        ) : (
          <div
            aria-label="Loading performance"
            className="animate-pulse rounded-xl bg-gray-100 dark:bg-white/5"
            style={{ height }}
          />
        )
      ) : (
        <>
          <div
            ref={ref}
            className="relative cursor-crosshair"
            style={{ height }}
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          >
            {ticks.map((t) => (
              <div
                key={t}
                className="absolute inset-x-0 border-t border-dashed border-gray-100 dark:border-white/10"
                style={{ top: y(t) }}
              >
                <span className="absolute -top-4 right-0 font-mono text-[10px] text-gray-400">
                  {t > 0 ? '+' : ''}
                  {t}%
                </span>
              </div>
            ))}
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              width="100%"
              height={H}
              className="absolute inset-0"
              aria-label="Portfolio performance vs S&P 500"
              role="img"
            >
              <defs>
                <linearGradient id="pf-perf-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="rgb(40,105,86)" stopOpacity="0.14" />
                  <stop offset="1" stopColor="rgb(40,105,86)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${pPath} L${W} ${H} L0 ${H}Z`} fill="url(#pf-perf-fill)" />
              <path
                d={bPath}
                fill="none"
                stroke="#9aa19d"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={pPath}
                fill="none"
                stroke="var(--tab-active)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              {hover != null && (
                <line
                  x1={x(hover)}
                  x2={x(hover)}
                  y1="0"
                  y2={H}
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>
            {hover != null && cur && (
              <span
                className="pointer-events-none absolute h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--tab-active)] shadow-[0_0_0_3px_var(--card-background)]"
                style={{ left: `${(hover / (data.length - 1)) * 100}%`, top: y(cur.p) }}
              />
            )}
          </div>
          <div className="mt-1.5 flex justify-between gap-2 font-mono text-[10.5px] text-gray-400">
            <span>{fmtD(data[0].d)}</span>
            {/* Shown on mobile too: touch devices never surface the Return tooltip. */}
            <span className="min-w-0 truncate font-sans" title={backTestNote(excluded)}>
              Based on current holdings
              {excluded.length > 0 && ` · excludes ${excluded.join(', ')}`}
            </span>
            <span>{fmtD(data[data.length - 1].d)}</span>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Allocation (real) ───────────────────── */
const ALLOC_COLORS = ['#286956', '#5a9c86', '#94c4b2', '#c9e0d7', '#a3aaa6', '#d9dbd8']
const ALLOC_BY = ['Sector', 'Country', 'Type'] as const
type AllocBy = (typeof ALLOC_BY)[number]

export function Allocation({
  holdings,
  variant = 'donut',
}: {
  holdings: PortfolioHolding[]
  variant?: 'donut' | 'bars'
}) {
  const [by, setBy] = useState<AllocBy>('Sector')
  const key = ({ Sector: 'sector', Country: 'country', Type: 'asset_type' } as const)[by]
  const groups = useMemo(() => {
    const m: Record<string, number> = {}
    for (const h of pricedHoldings(holdings)) {
      // 'Other' matches the backend's unknown value; guards a frontend deployed before the backend.
      const k = h[key] || 'Other'
      m[k] = (m[k] || 0) + h.weight
    }
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v], i) => ({ k, v, c: ALLOC_COLORS[Math.min(i, 5)] }))
  }, [holdings, key])
  if (!groups.length) return null

  const R = 42
  const C = 2 * Math.PI * R
  return (
    <Card
      title="Allocation"
      right={
        <Seg small label="Group allocation by" options={ALLOC_BY} value={by} onChange={setBy} />
      }
    >
      <div className={variant === 'donut' ? 'flex items-center gap-[18px]' : 'flex flex-col gap-3'}>
        {variant === 'donut' ? (
          <svg width="120" height="120" viewBox="0 0 120 120" className="flex-none" aria-hidden>
            {groups.map((g, i) => {
              const len = (g.v / 100) * C
              const offset = groups.slice(0, i).reduce((a, x) => a + (x.v / 100) * C, 0)
              return (
                <circle
                  key={g.k}
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  stroke={g.c}
                  strokeWidth="16"
                  strokeDasharray={`${Math.max(0, len - 1.5)} ${C}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 60 60)"
                />
              )
            })}
            <text
              x="60"
              y="57"
              textAnchor="middle"
              className="fill-current font-mono text-[17px] font-bold"
            >
              {groups[0].v.toFixed(0)}%
            </text>
            <text
              x="60"
              y="73"
              textAnchor="middle"
              className="fill-gray-500 text-[9.5px] font-semibold"
            >
              {groups[0].k.length > 12 ? groups[0].k.slice(0, 11) + '…' : groups[0].k}
            </text>
          </svg>
        ) : (
          <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-md">
            {groups.map((g) => (
              <span key={g.k} style={{ width: `${g.v}%`, background: g.c }} />
            ))}
          </div>
        )}
        <ul className="m-0 flex min-w-0 flex-1 list-none flex-col gap-[7px] p-0">
          {groups.map((g) => (
            <li key={g.k} className="flex items-center gap-2 text-sm">
              <i className="h-[9px] w-[9px] flex-none rounded-[3px]" style={{ background: g.c }} />
              <span className="min-w-0 flex-1 truncate">{g.k}</span>
              <b className="font-mono text-[12.5px] font-semibold">{g.v.toFixed(1)}%</b>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}

/* ── Risk (concentration real, market stats sample) ── */
export function Risk({ holdings }: { holdings: PortfolioHolding[] }) {
  const priced = pricedHoldings(holdings).sort((a, b) => b.weight - a.weight)
  const top = priced[0]
  const top3 = priced.slice(0, 3).reduce((a, h) => a + h.weight, 0)
  const nonEur = priced.filter((h) => h.currency !== 'EUR').reduce((a, h) => a + h.weight, 0)
  const tech = priced.filter((h) => h.sector === 'Technology').reduce((a, h) => a + h.weight, 0)
  const lvl = (v: number, a: number, b: number) =>
    v >= b
      ? (['High', 'down'] as const)
      : v >= a
        ? (['Elevated', 'warn'] as const)
        : (['OK', 'up'] as const)
  const rows = [
    {
      k: 'Beta vs S&P 500',
      v: SAMPLE_RISK.beta.toFixed(2),
      l: lvl(SAMPLE_RISK.beta, 1.1, 1.3),
      sample: true,
    },
    {
      k: 'Volatility (1Y, ann.)',
      v: SAMPLE_RISK.vol.toFixed(1) + '%',
      l: lvl(SAMPLE_RISK.vol, 18, 25),
      sample: true,
    },
    {
      k: 'Max drawdown (1Y)',
      v: SAMPLE_RISK.mdd.toFixed(1) + '%',
      l: lvl(-SAMPLE_RISK.mdd, 12, 20),
      sample: true,
    },
    {
      k: 'Largest position',
      v: top ? `${top.weight.toFixed(1)}%` : '—',
      n: top ? `${top.ticker} · top 3 = ${top3.toFixed(0)}%` : '',
      l: lvl(top?.weight ?? 0, 15, 25),
    },
    { k: 'Technology exposure', v: `${tech.toFixed(0)}%`, l: lvl(tech, 40, 55) },
    { k: 'Non-EUR exposure', v: `${nonEur.toFixed(0)}%`, l: lvl(nonEur, 60, 80) },
  ]
  const lvlClass = {
    down: 'bg-[var(--accent-down-soft)] text-[var(--accent-down)] dark:text-red-400',
    warn: 'bg-amber-600/10 text-amber-700 dark:text-amber-400',
    up: 'bg-[var(--accent-active-soft)] text-[var(--tab-active)] dark:text-[var(--accent-active-dark)]',
  }
  return (
    <Card title="Risk" right={<SampleBadge />}>
      <ul className="m-0 flex list-none flex-col p-0">
        {rows.map((r, i) => (
          <li
            key={r.k}
            className={`flex items-center justify-between gap-2.5 py-2 ${i ? 'border-t border-gray-100 dark:border-white/10' : 'pt-0.5'}`}
          >
            <div>
              <div className="text-sm font-medium">
                {r.k}
                {r.sample && (
                  <span className="ml-1 text-gray-400" title="Sample data">
                    *
                  </span>
                )}
              </div>
              {r.n && <div className="text-xs text-gray-500 dark:text-gray-400">{r.n}</div>}
            </div>
            <div className="flex items-center gap-2">
              <b className="font-mono text-sm">{r.v}</b>
              <span
                className={`min-w-[58px] rounded-full px-[7px] py-0.5 text-center text-[10.5px] font-bold ${lvlClass[r.l[1]]}`}
              >
                {r.l[0]}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/* ── Movers (real) ───────────────────────── */
export function Movers({
  holdings,
  currency,
  limit = 5,
}: {
  holdings: PortfolioHolding[]
  currency: string
  limit?: number
}) {
  // No previous close means no daily move: leave it out rather than show +€0.
  const ms = pricedHoldings(holdings)
    .filter((h): h is Priced & { day_change: number } => h.day_change !== null)
    .sort((a, b) => Math.abs(b.day_change) - Math.abs(a.day_change))
    .slice(0, limit)
  if (!ms.length) return null
  const max = Math.max(...ms.map((h) => Math.abs(h.day_change))) || 1
  return (
    <Card
      title="Today's movers"
      right={<span className="text-xs text-gray-500 dark:text-gray-400">by € impact</span>}
    >
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {ms.map((h) => (
          <li
            key={h.ticker}
            className="grid grid-cols-[26px_80px_minmax(0,1fr)_72px] items-center gap-2.5"
          >
            <TickerLogo ticker={h.ticker} size={26} />
            <div className="flex flex-col leading-tight">
              <b className="truncate text-sm">{h.ticker}</b>
              {h.day_change_percent === null ? (
                <span className="text-xs text-gray-400">—</span>
              ) : (
                <Delta v={h.day_change_percent} className="text-xs">
                  {Math.abs(h.day_change_percent).toFixed(2)}%
                </Delta>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded bg-gray-100 dark:bg-white/10">
              <span
                className={`block h-full rounded ${h.day_change >= 0 ? 'bg-[var(--tab-active)]' : 'bg-[var(--accent-down)]'}`}
                style={{ width: `${(Math.abs(h.day_change) / max) * 100}%` }}
              />
            </div>
            <b className={`text-right font-mono text-sm ${TONE_TEXT[tone(h.day_change)]}`}>
              {signedMoney(h.day_change, currency, 0)}
            </b>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/* ── News / Events / Dividends (sample) ──── */
const DOT = {
  up: 'bg-[var(--tab-active)]',
  down: 'bg-[var(--accent-down)]',
  neutral: 'bg-gray-400',
}

function TickerChip({ t }: { t: string }) {
  return (
    <span className="rounded-full border border-[var(--accent-active-border)] px-[7px] py-px font-mono text-[10.5px] font-semibold text-gray-700 dark:text-gray-300">
      {t}
    </span>
  )
}

export function News({ limit = 4 }: { limit?: number }) {
  return (
    <Card title="News for your holdings" right={<SampleBadge />}>
      <ul className="m-0 flex list-none flex-col p-0">
        {SAMPLE_NEWS.slice(0, limit).map((n, i) => (
          <li
            key={i}
            className={`flex gap-2.5 py-2.5 ${i ? 'border-t border-gray-100 dark:border-white/10' : 'pt-0'}`}
          >
            <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${DOT[n.sentiment]}`} />
            <div>
              <p className="m-0 text-base leading-snug text-pretty">{n.headline}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                {n.tickers.map((t) => (
                  <TickerChip key={t} t={t} />
                ))}
                <span className="text-gray-500 dark:text-gray-400">
                  {n.source} · {n.ago}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function Events({ limit = 5 }: { limit?: number }) {
  return (
    <Card title="Upcoming" right={<SampleBadge />}>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {SAMPLE_EVENTS.slice(0, limit).map((e, i) => {
          const [mo, d] = e.date.split(' ')
          return (
            <li key={i} className="flex items-center gap-3">
              <div className="w-10 flex-none rounded-[10px] border border-[var(--accent-active-border)] py-[3px] text-center leading-tight">
                <span className="block text-[9.5px] font-bold uppercase tracking-wide text-gray-500">
                  {mo}
                </span>
                <b className="font-mono text-[15px]">{d}</b>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <b className="text-sm">{e.ticker}</b>
                  <span
                    className={`rounded-full px-[7px] py-px text-[10.5px] font-semibold ${
                      e.type === 'earnings'
                        ? 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300'
                        : 'bg-[var(--accent-active-soft)] text-[var(--tab-active)] dark:text-[var(--accent-active-dark)]'
                    }`}
                  >
                    {e.type === 'earnings' ? 'Earnings' : 'Dividend'}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{e.detail}</span>
              </div>
              <span
                className={`font-mono text-xs ${e.daysAway <= 3 ? 'font-bold text-[var(--tab-active)]' : 'text-gray-500'}`}
              >
                {e.daysAway}d
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export function Dividends({ wide }: { wide?: boolean }) {
  const max = Math.max(...SAMPLE_DIV_RECEIVED)
  const ttm = SAMPLE_DIV_RECEIVED.reduce((a, b) => a + b, 0)
  const fwd = SAMPLE_DIV_PAYERS.reduce((a, p) => a + p.forward, 0)
  return (
    <Card title="Dividend income" right={<SampleBadge />}>
      <div
        className={
          wide
            ? 'flex flex-col gap-4 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_260px] lg:items-end lg:gap-8'
            : 'flex flex-col gap-4'
        }
      >
        <div className={`flex flex-wrap gap-6 ${wide ? 'lg:flex-col lg:gap-3' : ''}`}>
          <div>
            <Label>Received · 12m</Label>
            <div className="mt-1 font-mono text-lg font-bold">{money(ttm, 'EUR', 0)}</div>
          </div>
          <div>
            <Label>Forecast · next 12m</Label>
            <div className="mt-1 font-mono text-lg font-bold">{money(fwd, 'EUR', 0)}</div>
          </div>
        </div>
        <div className="flex h-[110px] items-stretch gap-1.5" aria-hidden>
          {SAMPLE_DIV_RECEIVED.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-[5px]">
              <span
                className={`min-h-[3px] w-full rounded-t ${i === 5 ? 'bg-[var(--tab-active)]' : 'bg-[#c9e0d7] dark:bg-[#2f5a4d]'}`}
                style={{ height: `${(v / max) * 100}%` }}
              />
              <em className="text-[10px] not-italic text-gray-400">{SAMPLE_DIV_MONTHS[i]}</em>
            </div>
          ))}
        </div>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {SAMPLE_DIV_PAYERS.map((p) => (
            <li
              key={p.ticker}
              className="grid grid-cols-[20px_1fr_auto_60px] items-center gap-2 text-sm"
            >
              <TickerLogo ticker={p.ticker} size={20} />
              <b>{p.ticker}</b>
              <span className="font-mono text-gray-500">{p.yieldPct.toFixed(2)}%</span>
              <b className="text-right font-mono">{money(p.forward, 'EUR', 0)}</b>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
