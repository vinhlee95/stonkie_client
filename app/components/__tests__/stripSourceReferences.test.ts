import { describe, it, expect } from 'vitest'
import { stripSourceReferences } from '../utils/stripSourceReferences'

describe('stripSourceReferences', () => {
  it('strips [Sources: id] references', () => {
    const input = 'Revenue grew 78%. [Sources: 0001045810-25-000230]'
    const result = stripSourceReferences(input)
    expect(result).toBe('Revenue grew 78%. ')
  })

  it('strips [Source: id] (singular) references', () => {
    const input = 'Net income was $5B. [Source: 0001045810-25-000230]'
    const result = stripSourceReferences(input)
    expect(result).toBe('Net income was $5B. ')
  })

  it('strips multiple source references', () => {
    const input = 'Revenue grew. [Sources: 001] Margins improved. [Sources: 002]'
    const result = stripSourceReferences(input)
    expect(result).toBe('Revenue grew.  Margins improved. ')
  })

  it('preserves standard markdown links', () => {
    const input =
      'See the [AAPL Annual 10-K Filing (2024)](https://www.sec.gov/Archives/edgar/data/320193/000032019324000123/aapl-20240928.htm) for details.'
    const result = stripSourceReferences(input)
    expect(result).toBe(input)
  })

  it('preserves markdown links with special characters in name', () => {
    const input =
      'Check [AAPL | Apple Inc. Annual Income Statement | MarketWatch](https://www.marketwatch.com/investing/stock/aapl/financials).'
    const result = stripSourceReferences(input)
    expect(result).toBe(input)
  })

  it('strips source refs while preserving markdown links in same text', () => {
    const input =
      'Revenue was $39.3B [Sources: 0001045810-25-000230]. See [Apple Q4 Report](https://apple.com/newsroom) for more.'
    const result = stripSourceReferences(input)
    expect(result).toBe(
      'Revenue was $39.3B . See [Apple Q4 Report](https://apple.com/newsroom) for more.',
    )
  })

  it('handles text with no source references', () => {
    const input = 'Revenue grew 78% year-over-year.'
    const result = stripSourceReferences(input)
    expect(result).toBe(input)
  })

  it('handles empty string', () => {
    expect(stripSourceReferences('')).toBe('')
  })

  it('is case insensitive', () => {
    const input = 'Data point. [SOURCES: abc123]'
    const result = stripSourceReferences(input)
    expect(result).toBe('Data point. ')
  })

  it('strips wrapping parentheses around markdown links: ( [name](url) )', () => {
    const input = 'computing. ( [NVIDIA Q2 Report](https://example.com/report.pdf) )'
    const result = stripSourceReferences(input)
    expect(result).toBe('computing. [NVIDIA Q2 Report](https://example.com/report.pdf)')
  })

  it('strips wrapping ( )] around markdown links', () => {
    const input = 'computing. ( [NVIDIA Q2 Report](https://example.com/report.pdf) )]'
    const result = stripSourceReferences(input)
    expect(result).toBe('computing. [NVIDIA Q2 Report](https://example.com/report.pdf)')
  })

  it('strips wrapping ([name](url)) pattern', () => {
    const input = 'demand for AI. ([NVIDIA Q2 Report](https://example.com/report.pdf))'
    const result = stripSourceReferences(input)
    expect(result).toBe('demand for AI. [NVIDIA Q2 Report](https://example.com/report.pdf)')
  })

  it('strips multiple wrapped markdown links', () => {
    const input =
      'Revenue grew. ( [Report A](https://a.com) ) Margins improved. ( [Report B](https://b.com) )]'
    const result = stripSourceReferences(input)
    expect(result).toBe(
      'Revenue grew. [Report A](https://a.com) Margins improved. [Report B](https://b.com)',
    )
  })

  it('converts [Sources: [name](url)] to just [name](url)', () => {
    const input =
      'revenue driver. [Sources: [SEC 10-K Filing 2025](https://www.sec.gov/Archives/edgar/data/1045810/0001045)]'
    const result = stripSourceReferences(input)
    expect(result).toBe(
      'revenue driver. [SEC 10-K Filing 2025](https://www.sec.gov/Archives/edgar/data/1045810/0001045)',
    )
  })

  it('converts multiple [Sources: [name](url)] inline', () => {
    const input =
      'driver. [Sources: [SEC Filing](https://sec.gov/a)], [Sources: [MarketWatch](https://mw.com/b)]'
    const result = stripSourceReferences(input)
    expect(result).toBe('driver. [SEC Filing](https://sec.gov/a), [MarketWatch](https://mw.com/b)')
  })

  it('handles ( [Sources: [name](url)] ) wrapping', () => {
    const input = 'computing. ( [Sources: [SEC Filing](https://sec.gov/a)] )'
    const result = stripSourceReferences(input)
    expect(result).toBe('computing. [SEC Filing](https://sec.gov/a)')
  })

  it('handles ( [Sources: [name](url)], [Sources: [name](url)] ) wrapping', () => {
    const input =
      'computing. ( [Sources: [SEC Filing](https://sec.gov/a)], [Sources: [Report](https://b.com)] )'
    const result = stripSourceReferences(input)
    expect(result).toBe('computing. [SEC Filing](https://sec.gov/a), [Report](https://b.com)')
  })

  it('strips [SOURCES_JSON]...[/SOURCES_JSON] blocks', () => {
    const input =
      'Revenue grew 6%.\n[SOURCES_JSON]{"sources": [{"name": "SEC 10-K", "url": "https://sec.gov/a"}]}[/SOURCES_JSON]\n\nMargins improved.'
    const result = stripSourceReferences(input)
    expect(result).toBe('Revenue grew 6%.\n\n\nMargins improved.')
  })

  it('strips multiline [SOURCES_JSON] blocks', () => {
    const input =
      'Revenue grew.\n[SOURCES_JSON]{\n  "sources": [\n    {"name": "SEC 10-K", "url": "https://sec.gov/a"}\n  ]\n}[/SOURCES_JSON]\nNext paragraph.'
    const result = stripSourceReferences(input)
    expect(result).toBe('Revenue grew.\n\nNext paragraph.')
  })
})
