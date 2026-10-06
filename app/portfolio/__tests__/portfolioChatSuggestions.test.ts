import { describe, expect, it } from 'vitest'
import { chatSuggestions, relatedSuggestions } from '../portfolioChatSuggestions'
import { holding, PORTFOLIO } from './chatFixtures'

describe('chatSuggestions', () => {
  it('builds Today and Performance & risk groups from the biggest € loser', () => {
    expect(chatSuggestions(PORTFOLIO, null)).toEqual([
      { label: 'Today', items: ["Explain today's move", 'Why is TSLA down 7.5%?'] },
      {
        label: 'Performance & risk',
        items: ['How did I do this week vs S&P?', "What's my biggest risk?"],
      },
    ])
  })

  it('skips the loser question when nothing is down', () => {
    const allUp = {
      ...PORTFOLIO,
      holdings: [holding({}), holding({ ticker: 'X', day_change: 0, day_change_percent: 0 })],
    }
    expect(chatSuggestions(allUp, null)[0].items).toEqual(["Explain today's move"])
  })

  it('ignores unpriced holdings', () => {
    const unpriced = {
      ...PORTFOLIO,
      holdings: [holding({ ticker: 'KNEBV.HE', day_change: null, day_change_percent: null })],
    }
    expect(chatSuggestions(unpriced, null)[0].items).toEqual(["Explain today's move"])
  })

  it('switches to holding questions when scoped', () => {
    expect(chatSuggestions(PORTFOLIO, PORTFOLIO.holdings[0])).toEqual([
      {
        label: 'AAPL',
        items: [
          'Why is AAPL up 4.8% today?',
          'How much does AAPL add to my risk?',
          'Is AAPL too big a part of my portfolio?',
        ],
      },
    ])
  })

  it('asks a neutral move question for a scoped holding without a price', () => {
    const unpriced = holding({ ticker: 'KNEBV.HE', day_change_percent: null })
    expect(chatSuggestions(PORTFOLIO, unpriced)[0].items[0]).toBe(
      "What's been driving KNEBV.HE lately?",
    )
  })
})

describe('relatedSuggestions', () => {
  it('returns up to 3 suggestions not yet asked', () => {
    const groups = chatSuggestions(PORTFOLIO, null)
    expect(relatedSuggestions(groups, ["Explain today's move"])).toEqual([
      'Why is TSLA down 7.5%?',
      'How did I do this week vs S&P?',
      "What's my biggest risk?",
    ])
    expect(
      relatedSuggestions(
        groups,
        groups.flatMap((g) => g.items),
      ),
    ).toEqual([])
  })
})
