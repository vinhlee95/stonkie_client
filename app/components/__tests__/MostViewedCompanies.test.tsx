import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MostViewedCompanies, {
  groupCompaniesBySector,
  normalizeSectorKey,
} from '../MostViewedCompanies'
import { Company } from '@/app/CompanyList'

function tickerLinks() {
  return screen
    .getAllByRole('link')
    .filter((el) => el.getAttribute('href')?.startsWith('/tickers/'))
}

describe('MostViewedCompanies sector grouping', () => {
  it('normalizes sector key case-insensitively', () => {
    expect(normalizeSectorKey('Technology')).toBe('technology')
    expect(normalizeSectorKey('TECHNOLOGY')).toBe('technology')
    expect(normalizeSectorKey('  Health Care  ')).toBe('health care')
  })

  it('merges companies with same sector under different casing', () => {
    const companies: Company[] = [
      {
        name: 'A',
        ticker: 'AAA',
        logo_url: '',
        sector: 'Technology',
      },
      {
        name: 'B',
        ticker: 'BBB',
        logo_url: '',
        sector: 'TECHNOLOGY',
      },
    ]
    const groups = groupCompaniesBySector(companies)
    expect(groups).toHaveLength(1)
    expect(groups[0].key).toBe('technology')
    expect(groups[0].label).toBe('Technology')
    expect(groups[0].companies).toHaveLength(2)
  })

  it('orders sectors by ticker count descending', () => {
    const companies: Company[] = [
      { name: 'F', ticker: 'F1', logo_url: '', sector: 'Financials' },
      { name: 'T1', ticker: 'T1', logo_url: '', sector: 'Technology' },
      { name: 'T2', ticker: 'T2', logo_url: '', sector: 'Technology' },
      { name: 'T3', ticker: 'T3', logo_url: '', sector: 'Technology' },
    ]
    const groups = groupCompaniesBySector(companies)
    expect(groups.map((g) => g.key)).toEqual(['technology', 'financials'])
  })

  it('renders one section per sector with all companies visible', () => {
    const companies: Company[] = [
      { name: 'A', ticker: 'AAA', logo_url: '', sector: 'Technology' },
      { name: 'B', ticker: 'BBB', logo_url: '', sector: 'Financials' },
      { name: 'C', ticker: 'CCC', logo_url: '', sector: 'Technology' },
    ]
    render(<MostViewedCompanies companies={companies} />)

    expect(screen.getByRole('heading', { name: 'Technology' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Financials' })).toBeInTheDocument()
    expect(tickerLinks()).toHaveLength(3)
  })
})
