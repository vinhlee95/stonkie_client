import { formatNumber } from "@/utils/formatter";
import GrowthChart from "./GrowthChart";

export default async function TickerDetails({ params }: { params: { ticker: string } }) {
  const { ticker } = await params;
  
  const keyStatsResponse = await fetch(`${process.env.BACKEND_URL}/api/companies/${ticker.toLocaleLowerCase()}/key-stats`, {
    // Add cache options as needed
    cache: 'no-store' // or { next: { revalidate: 60 } } for ISR
  })
  const keyStats = (await keyStatsResponse.json()).data

  const FINANCIAL_DATA_TYPES = ['income_statement', 'balance_sheet', 'cash_flow']
  const allFinancialResponses = await Promise.all(FINANCIAL_DATA_TYPES.map((type) => fetch(`${process.env.BACKEND_URL}/api/financial-data/${ticker.toLowerCase()}/${type}`)))
  const [incomeStatement, balanceSheet, cashFlow] = await Promise.all(allFinancialResponses.map(res => res.json()))

  return (
    <>
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
      <GrowthChart data={incomeStatement} />
    </>
  )
} 