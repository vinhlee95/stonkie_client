import { formatNumber } from "@/utils/formatter";

export type KeyStatsType = {
  name: string;
  market_cap: number;
  pe_ratio: number;
  revenue: number;
  net_income: number;
  basic_eps: number;
  dividend_yield: number;
  logo_url: string | null;
  country: string;
  description: string;
  industry: string;
  sector: string;
  exchange: string;
}

export default function KeyStats({keyStats}: {keyStats: KeyStatsType}) {
  return null
  
  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <h3>Market capitalization</h3>
          <p className="text-2xl font-bold">${formatNumber(keyStats.market_cap)}</p>
        </div>
        
        <div className="stat-card">
          <h3>Price to earnings Ratio (TTM)</h3>
          <p className="text-2xl font-bold">{keyStats.pe_ratio}</p>
        </div>
        
        <div className="stat-card">
          <h3>Dividend yield (indicated)</h3>
          <p className="text-2xl font-bold">{keyStats.dividend_yield}%</p>
        </div>
        
        <div className="stat-card">
          <h3>Basic EPS (TTM)</h3>
          <p className="text-2xl font-bold">${keyStats.basic_eps}</p>
        </div>
        
        <div className="stat-card">
          <h3>Net income (FY)</h3>
          <p className="text-2xl font-bold">${formatNumber(keyStats.net_income)}</p>
        </div>
        
        <div className="stat-card">
          <h3>Revenue (FY)</h3>
          <p className="text-2xl font-bold">${formatNumber(keyStats.revenue)}</p>
        </div>
      </div>
    </div>
  )
}
