import { describe, expect, it } from 'vitest'
import {
  asOf,
  localToday,
  money,
  pct,
  plural,
  priceDp,
  purchaseDate,
  shares,
  signedMoney,
  tone,
} from '../format'
import { isAmbiguousDecimal, parseDecimal, TICKER_RE, toYahooSymbol } from '@/lib/api/portfolio'

describe('money', () => {
  it('formats known currencies with symbol and grouping', () => {
    expect(money(1234.5)).toBe('€1,234.50')
    expect(money(1234.5, 'USD', 0)).toBe('$1,235')
  })
  it('prefixes negatives with a minus sign', () => {
    expect(money(-12.3, 'EUR')).toBe('−€12.30')
  })
  it('falls back to the currency code, or nothing when currency is null', () => {
    expect(money(5, 'SEK')).toBe('SEK 5.00')
    expect(money(5, null)).toBe('5.00')
  })
})

describe('signedMoney / pct', () => {
  it('always shows a sign; zero counts as positive', () => {
    expect(signedMoney(80, 'EUR', 0)).toBe('+€80')
    expect(signedMoney(-80, 'EUR', 0)).toBe('−€80')
    expect(signedMoney(0)).toBe('+€0.00')
    expect(pct(1.234)).toBe('+1.23%')
    expect(pct(-0.5, 1)).toBe('−0.5%')
  })
})

describe('shares / priceDp / tone', () => {
  it('shows whole shares without decimals and fractions up to 4 dp', () => {
    expect(shares(1200)).toBe('1,200')
    expect(shares(0.123456)).toBe('0.1235')
  })
  it('uses 3 dp below 20, 2 dp from 20', () => {
    expect(priceDp(19.99)).toBe(3)
    expect(priceDp(20)).toBe(2)
  })
  it('treats zero as up', () => {
    expect(tone(0)).toBe('up')
    expect(tone(-0.01)).toBe('down')
  })
})

describe('parseDecimal', () => {
  it.each([
    ['12', 12],
    ['12.5', 12.5],
    ['2,35', 2.35],
    ['12,5', 12.5],
    ['0,1255', 0.1255],
    ['1,000.5', 1000.5],
    ['1,000,000', 1000000],
    ['12,345,678', 12345678],
    [' 7 ', 7],
    ['.5', 0.5],
  ])('parses %j', (input, expected) => {
    expect(parseDecimal(input)).toBe(expected)
  })
  it.each(['', '1abc', '1.2.3', '-1', '1e3', '1,000,5', '1,2,3', '1,00.5', ','])(
    'rejects %j',
    (input) => {
      expect(parseDecimal(input)).toBeNaN()
    },
  )
  // 4,123 is 4123 on a US keyboard and 4.123 on an EU one: refuse to guess.
  it.each(['4,123', '0,125', '1,000', ' 1,200 '])('rejects ambiguous %j', (input) => {
    expect(parseDecimal(input)).toBeNaN()
    expect(isAmbiguousDecimal(input)).toBe(true)
  })
  it.each(['2,35', '1,000.5', '12,345,678', '4123', '4.123'])('%j is not ambiguous', (input) => {
    expect(isAmbiguousDecimal(input)).toBe(false)
  })
})

describe('plural', () => {
  it('uses the singular only for exactly one', () => {
    expect(plural(1, 'holding')).toBe('1 holding')
    expect(plural(0, 'holding')).toBe('0 holdings')
    expect(plural(2, 'holding')).toBe('2 holdings')
  })
})

describe('toYahooSymbol', () => {
  it.each([
    ['BRK.B', 'BRK-B'],
    ['BF.A', 'BF-A'],
    ['AAPL', 'AAPL'],
    ['VOD.L', 'VOD.L'],
    ['NDA FI.HE', 'NDA-FI.HE'],
    ['VOLV B.ST', 'VOLV-B.ST'],
    ['APPLE INC', 'APPLE INC'],
    ['BANK OF AMERICA', 'BANK OF AMERICA'],
    ['NOKIA.HE', 'NOKIA.HE'],
  ])('%s -> %s', (input, expected) => {
    expect(toYahooSymbol(input)).toBe(expected)
  })
})

describe('TICKER_RE', () => {
  it('rejects company-name searches after Yahoo mapping', () => {
    expect(TICKER_RE.test(toYahooSymbol('BANK OF AMERICA'))).toBe(false)
  })
  it.each(['AAPL', 'BRK-B', 'NOKIA.HE', 'EURUSD=X'])('accepts %s', (t) => {
    expect(TICKER_RE.test(t)).toBe(true)
  })
  it.each(['', 'aapl', '../me', '$$$', '^GSPC', 'A'.repeat(21)])('rejects %j', (t) => {
    expect(TICKER_RE.test(t)).toBe(false)
  })
})

describe('asOf', () => {
  // Local-time Dates so the expectations hold in any test timezone.
  const now = new Date(2026, 8, 25, 15, 0)
  const iso = (d: Date) => d.toISOString()

  it('shows only the time for a quote from today', () => {
    expect(asOf(iso(new Date(2026, 8, 25, 14, 32)), now)).toBe('14:32')
  })
  it('adds the weekday for a quote from earlier this week', () => {
    expect(asOf(iso(new Date(2026, 8, 25, 22, 0)), new Date(2026, 8, 27, 10, 0))).toBe('Fri 22:00')
  })
  it('shows the date for older quotes', () => {
    expect(asOf(iso(new Date(2026, 8, 10, 22, 0)), now)).toBe('10 Sep')
  })
})

describe('purchaseDate', () => {
  it('formats an ISO date without shifting it by the local timezone', () => {
    expect(purchaseDate('2025-03-12')).toBe('12 Mar 2025')
    expect(purchaseDate('2025-01-01')).toBe('1 Jan 2025')
  })
})

describe('localToday', () => {
  it('uses the local calendar date', () => {
    expect(localToday(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05')
    expect(localToday(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
  })
})
