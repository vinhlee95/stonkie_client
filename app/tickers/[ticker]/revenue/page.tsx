import { formatNumber } from "@/utils/formatter";
import RevenueChart from "./RevenueChart";

interface ProductRevenueBreakdown {
  product: string;
  revenue: number;
  percentage: number;
}

interface RegionRevenueBreakdown {
  region: string;
  revenue: number;
  percentage: number;
}

interface RevenueData {
  year: number;
  product_breakdown: ProductRevenueBreakdown[];
  region_breakdown: RegionRevenueBreakdown[];
}

type RevenueDataType = {
  year: number;
  breakdown: {
    label: string;
    revenue: number;
    percentage: number;
  }[];
}

function ProductRevenueTable({revenueData}: {revenueData: RevenueDataType[]}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">Products</th>
            {revenueData.map(yearData => (
              <th key={yearData.year} className="px-4 py-2 text-right border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                {yearData.year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from(new Set(revenueData.flatMap(yearData => 
            yearData.breakdown.map(item => item.label)
          ))).sort().map((product, rowIndex) => (
            <tr key={product} className={rowIndex % 2 === 0 ? "bg-gray-50 dark:bg-gray-900" : "bg-white dark:bg-black"}>
              <td className="px-4 py-2 border-b border-gray-300 dark:border-gray-700">{product}</td>
              {revenueData.map(yearData => {
                const productData = yearData.breakdown.find(item => item.label === product);
                return (
                  <td key={yearData.year} className="px-4 py-2 text-right border-b border-gray-300 dark:border-gray-700">
                    {productData ? formatNumber(productData.revenue) : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function Revenue({params}: {params: Promise<{ticker: string}>}) {
  const {ticker} = await params
  const res = await fetch(`${process.env.BACKEND_URL}/api/companies/${ticker.toLowerCase()}/revenue`, {
    next: {revalidate: 15*60}
  })
  const json = await res.json()
  if(!json || (json && json.status !== 'success') || (json && !json.data)) {
    return <p>Revenue data is not available for the ticker</p>
  }

  const revenueData = json.data as RevenueData[]
  if(!revenueData || revenueData.length === 0) {
    return <p>Revenue data is not available for the ticker</p>
  }

  const productRevenueData = revenueData.map(data => ({
    year: data.year,
    breakdown: data.product_breakdown.map(item => ({
      label: item.product,
      revenue: item.revenue,
      percentage: item.percentage
    }))
  })).sort((a, b) => a.year - b.year)

  const regionRevenueData = revenueData.map(data => ({
    year: data.year,
    breakdown: data.region_breakdown.map(item => ({
      label: item.region,
      revenue: item.revenue,
      percentage: item.percentage
    }))
  })).sort((a, b) => a.year - b.year)

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Product revenue breakdown: {ticker.toUpperCase()}</h1>
      <RevenueChart revenueData={productRevenueData} />
      <ProductRevenueTable revenueData={productRevenueData} />
      <h1 className="text-2xl font-bold mb-4 mt-4">Region revenue breakdown: {ticker.toUpperCase()}</h1>
      <RevenueChart revenueData={regionRevenueData} />
      <ProductRevenueTable revenueData={regionRevenueData} />
    </div>
  )
}