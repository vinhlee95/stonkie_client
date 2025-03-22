export default async function Statements({ params }: { params: Promise<{ ticker: string }> }) {
  const {ticker} = await params

  return (
    <>
      <h1>Statements</h1>
    </>
  )
}