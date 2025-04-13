import Tabs from "./Tab";

export default async function RootLayout({ children, params }: { children: React.ReactNode, params: Promise<{ticker: string}> }) {
  const {ticker} = await params
  return (
    <>
      <Tabs ticker={ticker} />
      <main>
        {children}
      </main>
    </>
  );
}