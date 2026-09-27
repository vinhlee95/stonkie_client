import { describe, expect, it } from 'vitest'
import { money, pct, priceDp, shares, signedMoney, tone } from '../format'
import { parseDecimal, TICKER_RE, toYahooSymbol } from '@/lib/api/portfolio'

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
    ['1,000', 1000],
    ['1,200', 1200],
    ['1,000.5', 1000.5],
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
})

describe('toYahooSymbol', () => {
  it.each([
    ['BRK.B', 'BRK-B'],
    ['BF.A', 'BF-A'],
    ['AAPL', 'AAPL'],
    ['VOD.L', 'VOD.L'],
    ['NOKIA.HE', 'NOKIA.HE'],
  ])('%s -> %s', (input, expected) => {
    expect(toYahooSymbol(input)).toBe(expected)
  })
})

describe('TICKER_RE', () => {
  it.each(['AAPL', 'BRK-B', 'NOKIA.HE', 'EURUSD=X'])('accepts %s', (t) => {
    expect(TICKER_RE.test(t)).toBe(true)
  })
  it.each(['', 'aapl', '../me', '$$$', '^GSPC', 'A'.repeat(21)])('rejects %j', (t) => {
    expect(TICKER_RE.test(t)).toBe(false)
  })
})
