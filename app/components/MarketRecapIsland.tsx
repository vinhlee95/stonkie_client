'use client'

import { useEffect, useState } from 'react'
import MarketRecapCard from './MarketRecapCard'
import {
  toBackendMarketCode,
  type FrontendMarketRecapKey,
  type MarketRecapPair,
} from '@/lib/api/marketRecap'

export default function MarketRecapIsland({ marketKey }: { marketKey: FrontendMarketRecapKey }) {
  const [pair, setPair] = useState<MarketRecapPair | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    const { signal } = ac

    ;(async () => {
      try {
        const backendMarket = toBackendMarketCode(marketKey)
        if (!backendMarket) return

        const res = await fetch(`/api/markets/${encodeURIComponent(backendMarket)}/recaps`, {
          signal,
        })
        if (!res.ok) return
        const data = (await res.json()) as MarketRecapPair
        if (signal.aborted) return
        setPair(data)
      } catch (err) {
        if (signal.aborted) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        // keep null; homepage stays usable
      }
    })()

    return () => {
      ac.abort()
    }
  }, [marketKey])

  if (!pair?.daily && !pair?.weekly) return null
  return <MarketRecapCard daily={pair.daily} weekly={pair.weekly} />
}
