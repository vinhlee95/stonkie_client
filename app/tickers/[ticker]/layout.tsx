import TabNavigation from "./TabNavigation";

export default async function RootLayout({ children, params }: { children: React.ReactNode, params: Promise<{ticker: string}> }) {
  const {ticker} = await params
  return (
    <>
      <TabNavigation ticker={ticker} />
      <main>
        <div className='p-4'>
          {children}
        </div>
      </main>
    </>
  );
}
