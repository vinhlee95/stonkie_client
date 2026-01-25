'use client'
import ETFList, { ETFListItem } from './ETFList'

export default function MostViewedETFs({ etfs }: { etfs: ETFListItem[] }) {
  return <ETFList etfs={etfs} />
}
