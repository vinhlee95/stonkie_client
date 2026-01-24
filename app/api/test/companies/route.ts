// Mock API endpoint for E2E testing
// Returns sample companies with industry data
export async function GET() {
  const mockCompanies = {
    data: [
      {
        name: 'Apple Inc.',
        ticker: 'AAPL',
        logo_url: 'https://logo.clearbit.com/apple.com',
        industry: 'Technology',
      },
      {
        name: 'Microsoft Corp',
        ticker: 'MSFT',
        logo_url: 'https://logo.clearbit.com/microsoft.com',
        industry: 'Technology',
      },
      {
        name: 'NVIDIA Corp',
        ticker: 'NVDA',
        logo_url: 'https://logo.clearbit.com/nvidia.com',
        industry: 'Technology',
      },
      {
        name: 'JPMorgan Chase',
        ticker: 'JPM',
        logo_url: 'https://logo.clearbit.com/jpmorganchase.com',
        industry: 'Financial Services',
      },
      {
        name: 'Bank of America',
        ticker: 'BAC',
        logo_url: 'https://logo.clearbit.com/bankofamerica.com',
        industry: 'Financial Services',
      },
      {
        name: 'Goldman Sachs',
        ticker: 'GS',
        logo_url: 'https://logo.clearbit.com/goldmansachs.com',
        industry: 'Financial Services',
      },
      {
        name: 'Johnson & Johnson',
        ticker: 'JNJ',
        logo_url: 'https://logo.clearbit.com/jnj.com',
        industry: 'Healthcare',
      },
      {
        name: 'Pfizer Inc.',
        ticker: 'PFE',
        logo_url: 'https://logo.clearbit.com/pfizer.com',
        industry: 'Healthcare',
      },
      {
        name: 'UnitedHealth Group',
        ticker: 'UNH',
        logo_url: 'https://logo.clearbit.com/unitedhealthgroup.com',
        industry: 'Healthcare',
      },
    ],
  }

  return Response.json(mockCompanies)
}
