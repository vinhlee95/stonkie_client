import { Company } from './CompanyList'
import FavouritesList from './components/FavouritesList'
import MostViewedCompanies from './components/MostViewedCompanies'
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
    <div className="container mx-auto px-4 pt-2 pb-6">
      <FavouritesList />
      {data && <MostViewedCompanies companies={data} etfs={etfData} />}
    </div>
  )
}
