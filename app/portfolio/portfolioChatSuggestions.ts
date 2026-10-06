import type { Portfolio, PortfolioHolding } from '@/lib/api/portfolio'

export interface SuggestionGroup {
  label: string
  items: string[]
}

const move = (pct: number) => `${pct >= 0 ? 'up' : 'down'} ${Math.abs(pct).toFixed(1)}%`

/** Starter questions for Portfolio chat, built from today's data. `scope` focuses them on one holding. */
export function chatSuggestions(
  portfolio: Portfolio,
  scope: PortfolioHolding | null,
): SuggestionGroup[] {
  if (scope) {
    const t = scope.ticker
    return [
      {
        label: t,
        items: [
          scope.day_change_percent == null
            ? `What's been driving ${t} lately?`
            : `Why is ${t} ${move(scope.day_change_percent)} today?`,
          `How much does ${t} add to my risk?`,
          `Is ${t} too big a part of my portfolio?`,
        ],
      },
    ]
  }

  const losers = portfolio.holdings.filter(
    (h) => h.day_change != null && h.day_change < 0 && h.day_change_percent != null,
  )
  const worst = losers.sort((a, b) => a.day_change! - b.day_change!)[0]
  return [
    {
      label: 'Today',
      items: [
        "Explain today's move",
        ...(worst ? [`Why is ${worst.ticker} ${move(worst.day_change_percent!)}?`] : []),
      ],
    },
    {
      label: 'Performance & risk',
      items: ['How did I do this week vs S&P?', "What's my biggest risk?"],
    },
  ]
}

/** Follow-ups shown after an answer: the starter questions not asked yet. */
export function relatedSuggestions(groups: SuggestionGroup[], asked: string[]): string[] {
  return groups
    .flatMap((g) => g.items)
    .filter((q) => !asked.includes(q))
    .slice(0, 3)
}
