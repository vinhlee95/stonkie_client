'use client'

import { useQuery } from '@tanstack/react-query'
import { Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { ChatboxUI } from '@/app/components/Chat'
import QuestionRow from '@/app/components/chat/QuestionRow'
import { useChatState } from '@/app/components/hooks/useChatState'
import { usePortfolioChatAPI } from '@/app/components/hooks/usePortfolioChatAPI'
import {
  fetchPortfolio,
  PORTFOLIO_QUERY_KEY,
  type Portfolio,
  type PortfolioHolding,
} from '@/lib/api/portfolio'
import { money, pct, plural, signedMoney, tone, TONE_TEXT } from '../format'
import { chatSuggestions, relatedSuggestions } from '../portfolioChatSuggestions'
import { TickerLogo } from './ui'

interface PortfolioChatProps {
  onClose: () => void
  isDesktop: boolean
  isClosing?: boolean
}

function GroupLabel({ children }: { children: string }) {
  return (
    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      {children}
    </div>
  )
}

function ContextCard({
  portfolio,
  scope,
  onClearScope,
}: {
  portfolio: Portfolio
  scope: PortfolioHolding | null
  onClearScope: () => void
}) {
  const { summary } = portfolio
  const value = scope ? scope.value : summary.total_value
  const dayChange = scope ? scope.day_change : summary.day_change
  const dayPct = scope ? scope.day_change_percent : summary.day_change_percent
  return (
    <div className="mb-5 rounded-xl border border-[rgba(40,105,86,0.13)] dark:border-[rgba(156,214,194,0.25)] bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-hover)] dark:text-[var(--accent-hover-dark)]">
            Your portfolio{scope && <> › {scope.ticker}</>}
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
            <span className="font-mono text-2xl font-semibold tabular-nums">
              {value == null ? '—' : money(value, 'EUR', 0)}
            </span>
            {dayChange != null && dayPct != null && (
              <span className={`font-mono tabular-nums ${TONE_TEXT[tone(dayChange)]}`}>
                {signedMoney(dayChange, 'EUR', 0)} ({pct(dayPct)}) today
              </span>
            )}
          </div>
        </div>
        {scope && (
          <button
            type="button"
            onClick={onClearScope}
            className="shrink-0 rounded-full border border-gray-300 dark:border-gray-600 px-3 py-1 text-sm hover:bg-white/60 dark:hover:bg-black/20 cursor-pointer"
          >
            Whole portfolio
          </button>
        )}
      </div>
      <p className="mt-2 text-base text-gray-700 dark:text-gray-200">
        {scope
          ? `${scope.weight == null ? 'Unpriced' : `${scope.weight.toFixed(1)}% of your portfolio`} · ${scope.sector}. Your position, cost basis and the rest of your portfolio are shared with the chat.`
          : `${plural(summary.holdings_count, 'holding')}, weights, cost basis, performance and risk are shared with the chat.`}
      </p>
    </div>
  )
}

function HoldingChips({
  holdings,
  scope,
  onToggle,
}: {
  holdings: PortfolioHolding[]
  scope: PortfolioHolding | null
  onToggle: (holding: PortfolioHolding) => void
}) {
  return (
    <div className="mb-5">
      <GroupLabel>Ask about a holding</GroupLabel>
      <div className="flex flex-wrap gap-2">
        {holdings.map((h) => {
          const on = scope?.ticker === h.ticker
          return (
            <button
              key={h.ticker}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(h)}
              className={`inline-flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 cursor-pointer transition-colors ${on ? 'border-[var(--accent-hover)] bg-[var(--accent-light)] dark:border-[var(--accent-hover-dark)] dark:bg-[var(--accent-light-dark)]' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60'}`}
            >
              <TickerLogo ticker={h.ticker} size={20} />
              <span className="font-semibold">{h.ticker}</span>
              {h.day_change_percent != null && (
                <span
                  className={`font-mono text-sm tabular-nums ${TONE_TEXT[tone(h.day_change_percent)]}`}
                >
                  {pct(h.day_change_percent, 1)}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ScopeChip({ holding, onClear }: { holding: PortfolioHolding; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 py-0.5 pl-0.5 pr-1.5 text-sm font-semibold">
      <TickerLogo ticker={holding.ticker} size={18} />
      {holding.ticker}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Stop focusing on ${holding.ticker}`}
        className="rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
      >
        <X size={12} />
      </button>
    </span>
  )
}

/** Chat about the signed-in user's portfolio, opened from the bottom nav on /portfolio. */
export default function PortfolioChat({ onClose, isDesktop, isClosing }: PortfolioChatProps) {
  // Shares the dashboard's cached snapshot; gcTime 0 for the same reason as usePortfolio.
  const { data: portfolio } = useQuery({
    queryKey: PORTFOLIO_QUERY_KEY,
    queryFn: fetchPortfolio,
    staleTime: 60 * 1000,
    gcTime: 0,
  })
  const [scope, setScope] = useState<PortfolioHolding | null>(null)
  const {
    threads,
    input,
    setInput,
    addThread,
    updateThread,
    deepAnalysis,
    setDeepAnalysis,
    preferredModel,
    setPreferredModel,
    conversationId,
    setConversationId,
    recordActivity,
  } = useChatState('portfolio')
  const { handleSubmit, isLoading, isThinking, cancelRequest } = usePortfolioChatAPI(
    scope?.ticker ?? null,
    updateThread,
    conversationId,
    setConversationId,
    recordActivity,
  )

  const groups = portfolio ? chatSuggestions(portfolio, scope) : []
  const toggleScope = (h: PortfolioHolding) => setScope(scope?.ticker === h.ticker ? null : h)

  const ask = async (question: string, threadId: string) => {
    await handleSubmit(question, threadId, false, deepAnalysis, preferredModel)
    const asked = [...threads.map((t) => t.question), question]
    updateThread(threadId, { relatedQuestions: relatedSuggestions(groups, asked) })
  }
  const askNew = (question: string) => ask(question, addThread(question))

  const placeholder = threads.length
    ? 'Ask a follow-up…'
    : scope
      ? `Ask about ${scope.ticker} in your portfolio…`
      : 'Ask about your portfolio…'

  return (
    <ChatboxUI
      threads={threads}
      input={input}
      setInput={setInput}
      addThread={addThread}
      handleSubmit={ask}
      isLoading={isLoading}
      isThinking={isThinking}
      cancelRequest={cancelRequest}
      onClose={onClose}
      isDesktop={isDesktop}
      isClosing={isClosing}
      handleFAQClick={askNew}
      deepAnalysis={deepAnalysis}
      setDeepAnalysis={setDeepAnalysis}
      preferredModel={preferredModel}
      setPreferredModel={setPreferredModel}
      placeholder={placeholder}
      inputAccessory={scope && <ScopeChip holding={scope} onClear={() => setScope(null)} />}
      header={{ icon: <Sparkles size={13} strokeWidth={2.4} />, title: 'Portfolio chat' }}
    >
      {portfolio && (
        <>
          <ContextCard portfolio={portfolio} scope={scope} onClearScope={() => setScope(null)} />
          {threads.length === 0 && (
            <>
              <HoldingChips holdings={portfolio.holdings} scope={scope} onToggle={toggleScope} />
              {groups.map((g) => (
                <div key={g.label} className="mb-5">
                  <GroupLabel>{g.label}</GroupLabel>
                  <div className="space-y-1.5">
                    {g.items.map((q) => (
                      <QuestionRow key={q} question={q} onAsk={askNew} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </ChatboxUI>
  )
}
