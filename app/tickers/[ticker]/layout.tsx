import TabNavigation from './TabNavigation'
import { KeyStatsType } from './KeyStats'
import TickerHeader from './TickerHeader'
import { Company } from '@/app/CompanyList'

async function LogoAndTickerBlock({ ticker }: { ticker: string }) {
  const keyStatsResponse = await fetch(
    `${process.env.BACKEND_URL}/api/companies/${ticker.toLocaleLowerCase()}/key-stats`,
    {
      next: { revalidate: 15 * 60 },
    },
  )
  const keyStats =
    keyStatsResponse.status === 200 ? ((await keyStatsResponse.json()).data as KeyStatsType) : null

  const company: Company | null = keyStats
    ? {
        ticker: ticker.toUpperCase(),
        name: keyStats.name,
        logo_url: keyStats.logo_url || '',
        industry: '',
      }
    : null

  return <TickerHeader ticker={ticker} company={company} exchange={keyStats?.exchange} />
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ ticker: string }>
}) {
  const { ticker } = await params

  return (
    <>
      <LogoAndTickerBlock ticker={ticker} />
      <TabNavigation ticker={ticker} />
      <main>
        <div className="px-4">{children}</div>
      </main>
    </>
  )
}
