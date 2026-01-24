// Mock API endpoint for E2E testing
// Returns sample companies with sector data
export async function GET() {
  const mockCompanies = {
    data: [
      {
        name: 'Apple Inc.',
        ticker: 'AAPL',
        logo_url: 'https://logo.clearbit.com/apple.com',
        sector: 'Technology',
      },
      {
        name: 'Microsoft Corp',
        ticker: 'MSFT',
        logo_url: 'https://logo.clearbit.com/microsoft.com',
        sector: 'Technology',
      },
      {
        name: 'NVIDIA Corp',
        ticker: 'NVDA',
        logo_url: 'https://logo.clearbit.com/nvidia.com',
        sector: 'Technology',
      },
      {
        name: 'JPMorgan Chase',
        ticker: 'JPM',
        logo_url: 'https://logo.clearbit.com/jpmorganchase.com',
        sector: 'Financial Services',
      },
      {
        name: 'Bank of America',
        ticker: 'BAC',
        logo_url: 'https://logo.clearbit.com/bankofamerica.com',
        sector: 'Financial Services',
      },
      {
        name: 'Goldman Sachs',
        ticker: 'GS',
        logo_url: 'https://logo.clearbit.com/goldmansachs.com',
        sector: 'Financial Services',
      },
      {
        name: 'Johnson & Johnson',
        ticker: 'JNJ',
        logo_url: 'https://logo.clearbit.com/jnj.com',
        sector: 'Healthcare',
      },
      {
        name: 'Pfizer Inc.',
        ticker: 'PFE',
        logo_url: 'https://logo.clearbit.com/pfizer.com',
        sector: 'Healthcare',
      },
      {
        name: 'UnitedHealth Group',
        ticker: 'UNH',
        logo_url: 'https://logo.clearbit.com/unitedhealthgroup.com',
        sector: 'Healthcare',
      },
    ],
  }

  return Response.json(mockCompanies)
}
