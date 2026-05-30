'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'
import PulseCard from './PulseCard'
import CollapsedMarketRow from './CollapsedMarketRow'
import SectionLabel from './SectionLabel'
import type { BriefData } from '../hooks/useBriefData'
import type { BriefMarketsResult } from '../hooks/useBriefMarkets'
import type { Company } from '@/app/CompanyList'

interface SmartBriefPanelProps {
  briefData: BriefData
  favourites: Company[]
  briefMarkets: BriefMarketsResult
  onDigIntoRecap: (recapId: string, marketKey: string) => void
  onAskQuestion: (question: string) => void
}

export default function SmartBriefPanel({
  briefData,
  favourites: _favourites,
  briefMarkets,
  onDigIntoRecap,
  onAskQuestion,
}: SmartBriefPanelProps) {
  const [expandedSecondary, setExpandedSecondary] = useState<string | null>(null)

  if (briefData.isLoading) {
    return <SmartBriefSkeleton />
  }

  const primaryData = briefData.markets[0]
  const secondaryData = briefData.markets.slice(1)

  return (
    <div className="pb-2">
      {/* Primary pulse — hero card */}
      <PulseCard
        market={primaryData}
        favouriteCount={briefMarkets.primary.favouriteCount}
        onDigIn={() => {
          if (primaryData.recapId) {
            onDigIntoRecap(primaryData.recapId, primaryData.market.key)
          }
        }}
      />

      {/* Secondary markets — accordion */}
      {secondaryData.length > 0 && (
        <>
          <SectionLabel icon={<Globe size={11} className="text-gray-500 dark:text-gray-400" />}>
            Also today
            <span className="ml-1 text-[10px] font-mono text-gray-400 dark:text-gray-500 normal-case tracking-normal">
              · tap to expand
            </span>
          </SectionLabel>
          <div className="space-y-1.5">
            {secondaryData.map((md) => {
              const favCount =
                briefMarkets.secondaries.find((s) => s.key === md.market.key)?.favouriteCount ?? 0

              return (
                <CollapsedMarketRow
                  key={md.market.key}
                  market={md}
                  favouriteCount={favCount}
                  expanded={expandedSecondary === md.market.key}
                  onToggle={() =>
                    setExpandedSecondary((cur) => (cur === md.market.key ? null : md.market.key))
                  }
                  onDigIn={() => {
                    if (md.recapId) onDigIntoRecap(md.recapId, md.market.key)
                  }}
                  onAskQuestion={onAskQuestion}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function SmartBriefSkeleton() {
  return (
    <div className="pb-2 space-y-3 animate-pulse">
      {/* Primary card skeleton */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 h-32" />
      {/* Secondary row skeletons */}
      <div className="mt-5 mb-2 h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 h-16" />
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 h-16" />
    </div>
  )
}
