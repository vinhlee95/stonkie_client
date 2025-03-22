import Link from "next/link";

const TABS = [
  {
    label: 'Income statements',
    path: ''
  },
  {
    label: 'Balance sheet',
    path: '/balance_sheet'
  },
  {
    label: 'Cash flow',
    path: '/cash_flow'
  }
]

function Tabs({ticker}: {ticker: string}) {
  return (
    <>      
      <div className="flex space-x-4 mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {TABS.map((tab) => (
          <Link key={tab.label} href={`/tickers/${ticker}/statements${tab.path}`}>
            <button
              key={tab.label}
              className={'px-6 py-3 rounded-full bg-slate-800 text-white font-medium flex-shrink-0'}
            >
              {tab.label}
            </button>
          </Link>
        ))}
      </div>
    </>
  );
}

export default async function RootLayout({ children, params }: { children: React.ReactNode, params: Promise<{ticker: string}> }) {
  const {ticker} = await params
  return (
    <>
      <Tabs ticker={ticker} />
      <main>
        <div className='p-4'>
          {children}
        </div>
      </main>
    </>
  );
}