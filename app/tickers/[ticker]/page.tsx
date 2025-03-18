import { formatNumber } from "@/utils/formatter";

export default async function TickerDetails({ params }: { params: { ticker: string } }) {
  const { ticker } = await params;
  
  const response = await fetch(`${process.env.BACKEND_URL}/api/companies/${ticker.toLocaleLowerCase()}/key-stats`, {
    // Add cache options as needed
    cache: 'no-store' // or { next: { revalidate: 60 } } for ISR
  })
  
  const data = (await response.json()).data
  
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <h3 className="text-gray-600">Market capitalization</h3>
          <p className="text-2xl font-bold">${formatNumber(data.market_cap)}</p>
        </div>
        
        <div className="stat-card">
          <h3 className="text-gray-600">Price to earnings Ratio (TTM)</h3>
          <p className="text-2xl font-bold">{data.pe_ratio}</p>
        </div>
        
        <div className="stat-card">
          <h3 className="text-gray-600">Dividend yield (indicated)</h3>
          <p className="text-2xl font-bold">{data.dividend_yield}%</p>
        </div>
        
        <div className="stat-card">
          <h3 className="text-gray-600">Basic EPS (TTM)</h3>
          <p className="text-2xl font-bold">${data.basic_eps}</p>
        </div>
        
        <div className="stat-card">
          <h3 className="text-gray-600">Net income (FY)</h3>
          <p className="text-2xl font-bold">${formatNumber(data.net_income)}</p>
        </div>
        
        <div className="stat-card">
          <h3 className="text-gray-600">Revenue (FY)</h3>
          <p className="text-2xl font-bold">${formatNumber(data.revenue)}</p>
        </div>
      </div>
    </div>
  )
} 