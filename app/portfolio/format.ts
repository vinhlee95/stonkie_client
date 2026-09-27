const SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', JPY: '¥' }

function symbol(currency: string | null | undefined): string {
  if (!currency) return ''
  return SYMBOLS[currency] ?? `${currency} `
}

function number(v: number, dp: number): string {
  return Math.abs(v).toLocaleString('en-US', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  })
}

/** €1,234.56 / −€1,234.56 */
export function money(v: number, currency: string | null = 'EUR', dp = 2): string {
  return (v < 0 ? '−' : '') + symbol(currency) + number(v, dp)
}

/** +€12 / −€12 */
export function signedMoney(v: number, currency: string | null = 'EUR', dp = 2): string {
  return (v >= 0 ? '+' : '−') + symbol(currency) + number(v, dp)
}

/** +1.23% / −1.23% */
export function pct(v: number, dp = 2): string {
  return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(dp) + '%'
}

/** Shares: integers without decimals, fractional up to 4 dp. */
export function shares(v: number): string {
  return v.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

/** Native price precision: sub-€20 prices get 3 dp. */
export function priceDp(v: number): number {
  return Math.abs(v) < 20 ? 3 : 2
}

const WEEK_MS = 6 * 24 * 60 * 60 * 1000

/** Quote time in local time: 14:32 today, Fri 22:00 this week, 10 Sep older. */
export function asOf(iso: string, now: Date = new Date()): string {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === now.toDateString()) return time
  if (now.getTime() - d.getTime() < WEEK_MS) {
    return `${d.toLocaleDateString('en-GB', { weekday: 'short' })} ${time}`
  }
  return `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`
}

/** 1 holding / 2 holdings */
export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

export const tone = (v: number): 'up' | 'down' => (v >= 0 ? 'up' : 'down')

export const TONE_TEXT = {
  up: 'text-[var(--tab-active)] dark:text-[var(--accent-active-dark)]',
  down: 'text-[var(--accent-down)] dark:text-red-400',
} as const
