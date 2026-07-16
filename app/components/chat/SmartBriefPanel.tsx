'use client'

import { useState, useMemo } from 'react'
import { Globe, Star, Compass } from 'lucide-react'
import PulseCard from './PulseCard'
import CollapsedMarketRow from './CollapsedMarketRow'
import WatchlistRow from './WatchlistRow'
import QuestionRow from './QuestionRow'
import SectionLabel from './SectionLabel'
import { matchesMarket } from '../MarketFilter'
import { usePriceChanges } from '../hooks/usePriceChanges'
import { useTickerRecaps } from '../hooks/useTickerRecaps'
import type { BriefData } from '../hooks/useBriefData'
import type { BriefMarket, BriefMarketsResult } from '../hooks/useBriefMarkets'
import type { Company } from '@/app/CompanyList'

interface SmartBriefPanelProps {
  briefData: BriefData
  favourites: Company[]
  briefMarkets: BriefMarketsResult
  onDigIntoRecap: (recapId: string, marketKey: string) => void
  onAskQuestion: (question: string) => void
  /** Closes the brief modal — called before navigating to a ticker page. */
  onClose?: () => void
  /** Removes a ticker from favourites. */
  onRemoveFavourite: (ticker: string) => void
}

export default function SmartBriefPanel({
  briefData,
  favourites,
  briefMarkets,
  onDigIntoRecap,
  onAskQuestion,
  onClose,
  onRemoveFavourite,
}: SmartBriefPanelProps) {
  const [expandedSecondary, setExpandedSecondary] = useState<string | null>(null)
  // Key on stable recap identity so unrelated re-renders (e.g. typing in the chat
  // input) don't re-run the random pick and reshuffle the questions. useBriefData
  // returns a fresh object each render, so depending on `briefData` directly reshuffles.
  const recapKey = briefData.markets.map((md) => md.recapId ?? '').join('|')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const crossMarketQuestions = useMemo(() => pickCrossMarketQuestions(briefData), [recapKey])
  const priceChanges = usePriceChanges(favourites.map((f) => f.ticker))
  const tickerRecaps = useTickerRecaps(favourites.map((f) => f.ticker))

  if (briefData.isLoading) {
    return <SmartBriefSkeleton />
  }

  const primaryData = briefData.markets[0]
  const secondaryData = briefData.markets.slice(1)

  const watchlist = sortWatchlist(favourites, briefMarkets)

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

      {/* Watchlist — favourites, sorted primary-market-first */}
      {watchlist.length > 0 && (
        <>
          <SectionLabel icon={<Star size={11} className="text-gray-500 dark:text-gray-400" />}>
            On your watchlist
          </SectionLabel>
          <div className="space-y-1.5">
            {watchlist.map(({ company, flag }) => (
              <WatchlistRow
                key={company.ticker}
                company={company}
                flag={flag}
                quote={priceChanges[company.ticker.toUpperCase()]}
                recapSummary={tickerRecaps[company.ticker.toUpperCase()]?.summary}
                onNavigate={onClose}
                onRemove={onRemoveFavourite}
              />
            ))}
          </div>
        </>
      )}

      {/* Across markets — 1 random question per market */}
      {crossMarketQuestions.length > 0 && (
        <>
          <SectionLabel icon={<Compass size={11} className="text-gray-500 dark:text-gray-400" />}>
            Across markets
          </SectionLabel>
          <div className="space-y-1.5">
            {crossMarketQuestions.map((q) => (
              <QuestionRow
                key={q.question}
                question={q.question}
                onAsk={(question) => {
                  onDigIntoRecap(q.recapId, q.marketKey)
                  onAskQuestion(question)
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

interface WatchlistEntry {
  company: Company
  flag: string
}

interface CrossMarketQuestion {
  question: string
  recapId: string
  marketKey: string
}

/** Picks 1 random question from each market's recap questions. */
function pickCrossMarketQuestions(briefData: BriefData): CrossMarketQuestion[] {
  return briefData.markets
    .map((md) => {
      const questions = md.recap?.questions ?? []
      if (questions.length === 0 || !md.recapId) return null
      return {
        question: questions[Math.floor(Math.random() * questions.length)],
        recapId: md.recapId,
        marketKey: md.market.key,
      }
    })
    .filter((q): q is CrossMarketQuestion => q !== null)
}

/** Sorts favourites primary-market-first and resolves each company's market flag. */
function sortWatchlist(favourites: Company[], briefMarkets: BriefMarketsResult): WatchlistEntry[] {
  const order: BriefMarket[] = [briefMarkets.primary, ...briefMarkets.secondaries]
  const marketOf = (company: Company) => order.find((m) => matchesMarket(m.key, company.country))
  const rankOf = (company: Company) => {
    const idx = order.findIndex((m) => matchesMarket(m.key, company.country))
    return idx === -1 ? order.length : idx
  }

  return [...favourites]
    .sort((a, b) => rankOf(a) - rankOf(b))
    .map((company) => ({ company, flag: marketOf(company)?.flag ?? '🌍' }))
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
