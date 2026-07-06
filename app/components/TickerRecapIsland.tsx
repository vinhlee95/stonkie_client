import TickerRecapCard from './TickerRecapCard'
import type { TickerRecapItem } from '@/lib/api/tickerRecap'

/**
 * Renders the ticker recap card. Data is fetched on the server and passed in as
 * props; returns nothing when the ticker has no recap.
 */
export default function TickerRecapIsland({
  symbol,
  daily,
  weekly,
}: {
  symbol: string
  daily: TickerRecapItem | null
  weekly: TickerRecapItem | null
}) {
  if (!daily && !weekly) return null

  return (
    // `lg:relative` makes this the containing block for the absolutely-filled
    // recap on desktop, so the recap can't grow the row — it scrolls inside.
    <div className="h-full lg:relative">
      <TickerRecapCard symbol={symbol} daily={daily} weekly={weekly} />
    </div>
  )
}
