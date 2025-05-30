import Link from 'next/link';

const BACKEND_URL = process.env.BACKEND_URL

interface Company {
  name: string;
  ticker: string;
  logo_url: string;
}

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
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.map((company) => (
            <Link 
              key={company.ticker} 
              href={`/tickers/${company.ticker}`}
              className="bg-[var(--button-background)] hover:bg-[var(--button-hover)] dark:bg-[var(--button-background-dark)] dark:hover:bg-[var(--button-hover-dark)] transition-colors duration-200 rounded-xl p-4 flex items-center cursor-pointer"
            >
              {company.logo_url && (
                <div className="w-12 h-12 mr-4 flex-shrink-0">
                  <img 
                    src={company.logo_url} 
                    alt={`${company.name} logo`} 
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              )}
              <div>
                <h3 className="text-gray-800 dark:text-white text-lg font-medium">{company.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{company.ticker}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
