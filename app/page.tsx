import { Company } from './CompanyList'
import MarketChart from './MarketChart'
import CompanySearchWrapper from './components/CompanySearchWrapper'
import FavouritesList from './components/FavouritesList'
import MostViewedCompanies from './components/MostViewedCompanies'
import MostViewedETFs from './components/MostViewedETFs'
import { ETFListItem } from './components/ETFList'

const BACKEND_URL = process.env.BACKEND_URL

// Remove React Query and use Next.js server component data fetching
export default async function Page() {
  // Fetch data directly in the server component
  const response = await fetch(`${BACKEND_URL}/api/companies/most-viewed`, {
    next: { revalidate: 1 * 60, tags: ['most-viewed-companies'] },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch most viewed companies')
  }

  const data = (await response.json()).data as Company[]

  // Fetch ETFs
  let etfData: ETFListItem[] = []
  try {
    const etfResponse = await fetch(`${BACKEND_URL}/api/etf`, {
      next: { revalidate: 1 * 60, tags: ['etfs'] },
    })

    if (etfResponse.ok) {
      const etfJson = await etfResponse.json()
      // Handle different response formats: { data: [...] } or [...]
      etfData = (etfJson.data || etfJson) as ETFListItem[]
    }
  } catch (error) {
    // Silently fail if ETF endpoint doesn't exist yet
    console.error('Failed to fetch ETFs:', error)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CompanySearchWrapper companies={data} />
      <h1 className="text-2xl font-bold mb-6">Market Overview</h1>
      <div className="h-[350px] mb-6">
        <MarketChart />
      </div>
      <FavouritesList />
      <h1 className="text-2xl font-bold mb-6">Most Viewed Companies</h1>
      {data && <MostViewedCompanies companies={data} />}
      <h1 className="text-2xl font-bold mb-6 mt-8">ETFs</h1>
      {etfData && etfData.length > 0 && <MostViewedETFs etfs={etfData} />}
    </div>
  )
}
