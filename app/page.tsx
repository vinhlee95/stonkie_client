const BACKEND_URL = 'http://localhost:8080'

interface Company {
  name: string;
  ticker: string;
  logo_url: string;
}

// Remove React Query and use Next.js server component data fetching
export default async function Page() {
  // Fetch data directly in the server component
  const response = await fetch(`${BACKEND_URL}/api/companies/most-viewed`, {
    // Add cache options as needed
    cache: 'no-store' // or { next: { revalidate: 60 } } for ISR
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch most viewed companies')
  }
  
  const data = (await response.json()).data as Company[]

  return (
    <div>
      <h1>Hello, Next.js!</h1>
      <h2>Most Viewed Companies</h2>
      {data && (
        <ul>
          {data.map((company) => (
            <li key={company.ticker}>{company.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}