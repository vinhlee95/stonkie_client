import CompanyList, { Company } from '@/app/CompanyList'

// Test page for E2E testing of industry filter functionality
// Uses mock API endpoint with industry data
export default async function TestIndustryFilterPage() {
  // Fetch mock data from test API endpoint
  const response = await fetch('http://localhost:3000/api/test/companies', {
    cache: 'no-store', // Disable caching for testing
  })

  if (!response.ok) {
    throw new Error('Failed to fetch test companies')
  }

  const data = (await response.json()).data as Company[]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Industry Filter Test Page</h1>
      <p className="mb-4 text-gray-600">
        This page uses mock data for E2E testing of the industry filter feature.
      </p>
      <h2 className="text-xl font-bold mb-6">Most Viewed Companies</h2>
      {data && <CompanyList companies={data} />}
    </div>
  )
}
