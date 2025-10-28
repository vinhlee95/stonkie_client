import CompanyList, { Company } from './CompanyList'
import MarketChart from './MarketChart'
import CompanySearchWrapper from './components/CompanySearchWrapper'

const BACKEND_URL = process.env.BACKEND_URL

// Remove React Query and use Next.js server component data fetching
export default async function Page() {
  // Fetch data directly in the server component
  const response = await fetch(`${BACKEND_URL}/api/companies/most-viewed`, {
    next: { revalidate: 5 * 60, tags: ['most-viewed-companies'] },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch most viewed companies')
  }

  const data = (await response.json()).data as Company[]

  return (
    <div className="container mx-auto px-4 py-8">
      <CompanySearchWrapper />
      <h1 className="text-2xl font-bold mb-6">Market Overview</h1>
      <div className="h-[350px] mb-6">
        <MarketChart />
      </div>
      <h1 className="text-2xl font-bold mb-6">Most Viewed Companies</h1>
      {data && <CompanyList companies={data} />}
    </div>
  )
}
