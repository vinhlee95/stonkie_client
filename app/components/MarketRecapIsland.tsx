'use client'

import { useCallback, useEffect, useState } from 'react'
import MarketRecapCard from './MarketRecapCard'
import MarketRecapCardPlaceholder from './MarketRecapCardPlaceholder'
import RecapChatModal from './RecapChatModal'
import MarketRecapUnavailable, {
  type MarketRecapUnavailablePeriod,
  type MarketRecapUnavailableVariant,
} from './MarketRecapUnavailable'
import {
  toBackendMarketCode,
  type FrontendMarketRecapKey,
  type MarketRecapPair,
} from '@/lib/api/marketRecap'

type Unavailable = { variant: MarketRecapUnavailableVariant } | null

type InnerProps = {
  marketKey: FrontendMarketRecapKey
  unavailablePeriod: MarketRecapUnavailablePeriod
  onRetryRequest: () => void
}

function MarketRecapIslandInner({ marketKey, unavailablePeriod, onRetryRequest }: InnerProps) {
  const [pair, setPair] = useState<MarketRecapPair | null>(null)
  const [pending, setPending] = useState(true)
  const [unavailable, setUnavailable] = useState<Unavailable>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [activeCadence, setActiveCadence] = useState<'daily' | 'weekly'>(
    pair?.daily ? 'daily' : 'weekly',
  )

  useEffect(() => {
    const backendMarket = toBackendMarketCode(marketKey)
    if (!backendMarket) {
      queueMicrotask(() => setPending(false))
      return
    }

    const ac = new AbortController()
    const { signal } = ac

    ;(async () => {
      try {
        const res = await fetch(`/api/markets/${encodeURIComponent(backendMarket)}/recaps`, {
          signal,
        })
        if (signal.aborted) return
        if (!res.ok) {
          setUnavailable({ variant: 'fetch-failed' })
          setPending(false)
          return
        }
        const data = (await res.json()) as MarketRecapPair
        if (signal.aborted) return
        if (!data.daily && !data.weekly) {
          setUnavailable({ variant: 'no-data' })
          setPending(false)
          return
        }
        setPair(data)
        setPending(false)
      } catch (err) {
        if (signal.aborted) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        setUnavailable({ variant: 'fetch-failed' })
        setPending(false)
      }
    })()

    return () => {
      ac.abort()
    }
  }, [marketKey])

  if (pending) {
    return <MarketRecapCardPlaceholder />
  }
  if (unavailable) {
    return (
      <MarketRecapUnavailable
        variant={unavailable.variant}
        period={unavailablePeriod}
        onRetry={onRetryRequest}
      />
    )
  }
  if (!pair?.daily && !pair?.weekly) return null
  const activeRecap =
    activeCadence === 'daily' ? (pair.daily ?? pair.weekly) : (pair.weekly ?? pair.daily)
  return (
    <>
      <MarketRecapCard
        daily={pair.daily}
        weekly={pair.weekly}
        onDigDeeper={(cadence) => {
          setActiveCadence(cadence)
          setChatOpen(true)
        }}
      />
      {activeRecap && (
        <RecapChatModal
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          recap={activeRecap}
          market={marketKey}
          cadence={activeCadence}
        />
      )}
    </>
  )
}

export default function MarketRecapIsland({
  marketKey,
  unavailablePeriod = 'week',
}: {
  marketKey: FrontendMarketRecapKey
  /** Shown when the API returns no recap; wording matches day vs week context. */
  unavailablePeriod?: MarketRecapUnavailablePeriod
}) {
  const [retryKey, setRetryKey] = useState(0)
  const handleRetryRequest = useCallback(() => {
    setRetryKey((k) => k + 1)
  }, [])

  return (
    <MarketRecapIslandInner
      key={`${marketKey}-${retryKey}`}
      marketKey={marketKey}
      unavailablePeriod={unavailablePeriod}
      onRetryRequest={handleRetryRequest}
    />
  )
}
