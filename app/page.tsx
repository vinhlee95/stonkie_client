import CompanyList, {Company} from './CompanyList';

const BACKEND_URL = process.env.BACKEND_URL

// Remove React Query and use Next.js server component data fetching
export default async function Page() {
  // Fetch data directly in the server component
  const response = await fetch(`${BACKEND_URL}/api/companies/most-viewed`, {
    next: { revalidate: 5 * 60, tags: ['most-viewed-companies'] }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch most viewed companies')
  }
  
  const data = (await response.json()).data as Company[]

  return (
    <div className="container mx-auto px-4 py-8">
      {data && <CompanyList companies={data}/>}
    </div>
  )
}
