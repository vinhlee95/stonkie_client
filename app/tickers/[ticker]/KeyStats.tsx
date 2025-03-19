import { formatNumber } from "@/utils/formatter";

export type KeyStatsType = {
  market_cap: number;
  pe_ratio: number;
  revenue: number;
  net_income: number;
  basic_eps: number;
  dividend_yield: number;
}

export default function KeyStats({keyStats}: {keyStats: KeyStatsType}) {
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <h3 className="text-gray-600">Market capitalization</h3>
          <p className="text-2xl font-bold">${formatNumber(keyStats.market_cap)}</p>
        </div>
        
        <div className="stat-card">
          <h3 className="text-gray-600">Price to earnings Ratio (TTM)</h3>
          <p className="text-2xl font-bold">{keyStats.pe_ratio}</p>
        </div>
        
        <div className="stat-card">
          <h3 className="text-gray-600">Dividend yield (indicated)</h3>
          <p className="text-2xl font-bold">{keyStats.dividend_yield}%</p>
        </div>
        
        <div className="stat-card">
          <h3 className="text-gray-600">Basic EPS (TTM)</h3>
          <p className="text-2xl font-bold">${keyStats.basic_eps}</p>
        </div>
        
        <div className="stat-card">
          <h3 className="text-gray-600">Net income (FY)</h3>
          <p className="text-2xl font-bold">${formatNumber(keyStats.net_income)}</p>
        </div>
        
        <div className="stat-card">
          <h3 className="text-gray-600">Revenue (FY)</h3>
          <p className="text-2xl font-bold">${formatNumber(keyStats.revenue)}</p>
        </div>
      </div>
    </div>
  )
}
