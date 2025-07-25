import TabNavigation from './TabNavigation'
import { KeyStatsType } from './KeyStats'
import Link from 'next/link'

async function LogoAndTickerBlock({ ticker }: { ticker: string }) {
  const keyStatsResponse = await fetch(
    `${process.env.BACKEND_URL}/api/companies/${ticker.toLocaleLowerCase()}/key-stats`,
    {
      next: { revalidate: 15 * 60 },
    },
  )
  const keyStats =
    keyStatsResponse.status === 200 ? ((await keyStatsResponse.json()).data as KeyStatsType) : null

  return (
    <Link href={`/tickers/${ticker}`}>
      <div className="flex items-center gap-4 p-4 pb-0">
        {keyStats?.logo_url && (
          <img
            src={keyStats.logo_url}
            alt={`${ticker} logo`}
            className="w-12 h-12 object-contain rounded-full"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{keyStats?.name}</h1>
          <h2>
            {ticker.toUpperCase()} - {keyStats?.exchange}
          </h2>
        </div>
      </div>
    </Link>
  )
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
