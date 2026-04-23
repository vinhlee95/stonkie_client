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
        country: 'USA',
        exchange: 'NASDAQ',
      },
      {
        name: 'Microsoft Corp',
        ticker: 'MSFT',
        logo_url: 'https://logo.clearbit.com/microsoft.com',
        sector: 'Technology',
        country: 'USA',
        exchange: 'NASDAQ',
      },
      {
        name: 'NVIDIA Corp',
        ticker: 'NVDA',
        logo_url: 'https://logo.clearbit.com/nvidia.com',
        sector: 'Technology',
        country: 'USA',
        exchange: 'NASDAQ',
      },
      {
        name: 'JPMorgan Chase',
        ticker: 'JPM',
        logo_url: 'https://logo.clearbit.com/jpmorganchase.com',
        sector: 'Financial Services',
        country: 'USA',
        exchange: 'NYSE',
      },
      {
        name: 'Bank of America',
        ticker: 'BAC',
        logo_url: 'https://logo.clearbit.com/bankofamerica.com',
        sector: 'Financial Services',
        country: 'USA',
        exchange: 'NYSE',
      },
      {
        name: 'Goldman Sachs',
        ticker: 'GS',
        logo_url: 'https://logo.clearbit.com/goldmansachs.com',
        sector: 'Financial Services',
        country: 'USA',
        exchange: 'NYSE',
      },
      {
        name: 'Johnson & Johnson',
        ticker: 'JNJ',
        logo_url: 'https://logo.clearbit.com/jnj.com',
        sector: 'Healthcare',
        country: 'USA',
        exchange: 'NYSE',
      },
      {
        name: 'Pfizer Inc.',
        ticker: 'PFE',
        logo_url: 'https://logo.clearbit.com/pfizer.com',
        sector: 'Healthcare',
        country: 'USA',
        exchange: 'NYSE',
      },
      {
        name: 'UnitedHealth Group',
        ticker: 'UNH',
        logo_url: 'https://logo.clearbit.com/unitedhealthgroup.com',
        sector: 'Healthcare',
        country: 'USA',
        exchange: 'NYSE',
      },
    ],
  }

  return Response.json(mockCompanies)
}
