import { pickBriefMarkets } from '../useBriefMarkets'
import type { Company } from '@/app/CompanyList'

function company(overrides: Partial<Company> = {}): Company {
  return {
    ticker: 'TEST',
    name: 'Test Co',
    logo_url: '',
    sector: '',
    country: 'USA',
    exchange: 'NASDAQ',
    ...overrides,
  }
}

describe('pickBriefMarkets', () => {
  it('returns all 3 markets even with 0 favourites', () => {
    const result = pickBriefMarkets([])
    const keys = [result.primary.key, ...result.secondaries.map((s) => s.key)]
    expect(keys).toHaveLength(3)
    expect(keys).toContain('USA')
    expect(keys).toContain('Finland')
    expect(keys).toContain('Vietnam')
  })

  it('picks market with most favourites as primary', () => {
    const favs = [
      company({ ticker: 'NOK', country: 'Finland' }),
      company({ ticker: 'WAR', country: 'Finland' }),
      company({ ticker: 'KON', country: 'Finland' }),
      company({ ticker: 'AAPL', country: 'USA' }),
    ]
    const result = pickBriefMarkets(favs)
    expect(result.primary.key).toBe('Finland')
    expect(result.primary.favouriteCount).toBe(3)
  })

  it('breaks tie using locale', () => {
    const favs = [
      company({ ticker: 'AAPL', country: 'USA' }),
      company({ ticker: 'NOK', country: 'Finland' }),
    ]
    // Both have 1 fav — locale fi-FI should pick Finland
    const result = pickBriefMarkets(favs, 'fi-FI')
    expect(result.primary.key).toBe('Finland')
  })

  it('falls back to US when locale matches no market', () => {
    const result = pickBriefMarkets([], 'ja-JP')
    expect(result.primary.key).toBe('USA')
  })

  it('falls back to US with 0 favourites and default locale', () => {
    const result = pickBriefMarkets([], 'en-US')
    expect(result.primary.key).toBe('USA')
  })

  it('returns secondaries sorted by fav count desc', () => {
    const favs = [
      company({ ticker: 'AAPL', country: 'USA' }),
      company({ ticker: 'MSFT', country: 'USA' }),
      company({ ticker: 'MSFT2', country: 'USA' }),
      company({ ticker: 'FPT', country: 'Vietnam' }),
      company({ ticker: 'VCB', country: 'Vietnam' }),
      company({ ticker: 'NOK', country: 'Finland' }),
    ]
    const result = pickBriefMarkets(favs)
    expect(result.primary.key).toBe('USA')
    expect(result.secondaries[0].key).toBe('Vietnam')
    expect(result.secondaries[0].favouriteCount).toBe(2)
    expect(result.secondaries[1].key).toBe('Finland')
    expect(result.secondaries[1].favouriteCount).toBe(1)
  })

  it('attaches correct metadata', () => {
    const result = pickBriefMarkets([])
    const us = [result.primary, ...result.secondaries].find((m) => m.key === 'USA')!
    expect(us.flag).toBe('🇺🇸')
    expect(us.label).toBe('US')
    expect(us.backendCode).toBe('US')
    expect(us.indexLabel).toBe('S&P 500')

    const fi = [result.primary, ...result.secondaries].find((m) => m.key === 'Finland')!
    expect(fi.indexLabel).toBe('OMXH25')
    expect(fi.backendCode).toBe('FI')

    const vn = [result.primary, ...result.secondaries].find((m) => m.key === 'Vietnam')!
    expect(vn.indexLabel).toBe('VN-Index')
    expect(vn.backendCode).toBe('VN')
  })
})
