import TabNavigation from "./TabNavigation";
import { KeyStatsType } from "./KeyStats";

async function LogoAndTickerBlock({ ticker }: { ticker: string }) {
  const keyStatsResponse = await fetch(`${process.env.BACKEND_URL}/api/companies/${ticker.toLocaleLowerCase()}/key-stats`, {
    next: { revalidate: 15*60 }
  });
  const keyStats = keyStatsResponse.status === 200 ? (await keyStatsResponse.json()).data as KeyStatsType : null;

  return (
    <div className="flex items-center gap-4 p-4 pb-0">
      {keyStats?.logo_url && (
        <img 
          src={keyStats.logo_url} 
          alt={`${ticker} logo`} 
          className="w-12 h-12 object-contain rounded-full"
        />
      )}
      <h1 className="text-2xl font-bold">{ticker.toUpperCase()}</h1>
    </div>
  );
}

export default async function RootLayout({ children, params }: { children: React.ReactNode, params: Promise<{ticker: string}> }) {
  const {ticker} = await params;
  
  return (
    <>
      <LogoAndTickerBlock ticker={ticker} />
      <TabNavigation ticker={ticker} />
      <main>
        <div className='p-4'>
          {children}
        </div>
      </main>
    </>
  );
}
