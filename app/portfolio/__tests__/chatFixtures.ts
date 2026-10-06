import type { Portfolio, PortfolioHolding } from '@/lib/api/portfolio'

export function holding(over: Partial<PortfolioHolding>): PortfolioHolding {
  return {
    ticker: 'AAPL',
    name: 'Apple Inc',
    shares: 10,
    avg_cost: 100,
    lots: [],
    currency: 'USD',
    price: 210,
    day_change_percent: 4.84,
    trading_date: '2026-10-02',
    as_of: null,
    delayed: false,
    fx_rate: 0.86,
    value: 6000,
    cost_basis: 4000,
    day_change: 280,
    total_return: 2000,
    total_return_percent: 50,
    weight: 60,
    sector: 'Technology',
    country: 'United States',
    asset_type: 'Stock',
    ...over,
  }
}

export const PORTFOLIO: Portfolio = {
  base_currency: 'EUR',
  summary: {
    holdings_count: 3,
    priced_count: 3,
    total_value: 10000,
    total_cost: 8000,
    total_return: 2000,
    total_return_percent: 25,
    day_change: -163,
    day_change_percent: -0.26,
    as_of: null,
    delayed_count: 0,
  },
  holdings: [
    holding({}),
    holding({
      ticker: 'TSLA',
      name: 'Tesla, Inc.',
      value: 3000,
      weight: 30,
      day_change: -243,
      day_change_percent: -7.49,
    }),
    holding({
      ticker: 'DELL',
      name: 'Dell Technologies',
      value: 1000,
      weight: 10,
      day_change: -200,
      day_change_percent: -7.27,
    }),
  ],
}
