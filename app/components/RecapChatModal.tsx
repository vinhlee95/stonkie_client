'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { ChatboxUI } from './Chat'
import { useChatState } from './hooks/useChatState'
import { useRecapChatAPI } from './hooks/useRecapChatAPI'
import { useScrollLock } from './hooks/useScrollLock'
import RecapAudioControls from './RecapAudioControls'
import type { MarketRecapItem } from '@/lib/api/marketRecap'

interface RecapChatModalProps {
  open: boolean
  onClose: () => void
  recap: MarketRecapItem
  market: string
  cadence: string
}

function formatPeriodShort(periodStart: string, periodEnd: string): string {
  const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
  const start = new Date(`${periodStart}T00:00:00Z`)
  const end = new Date(`${periodEnd}T00:00:00Z`)
  if (Number.isNaN(start.getTime())) return periodStart
  if (periodStart === periodEnd || Number.isNaN(end.getTime())) return fmt.format(start)
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

function RecapContextCard({ recap, title }: { recap: MarketRecapItem; title: string }) {
  return (
    <div className="mb-4 rounded-xl border border-[rgba(40,105,86,0.13)] dark:border-[rgba(156,214,194,0.25)] bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] p-3 flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <p className="mt-0.5 text-base leading-6 text-gray-700 dark:text-gray-200">
          {recap.summary}
        </p>
        <RecapAudioControls
          audio={recap.audio}
          trackId={`recap-chat:${recap.id}`}
          title={title}
          className="mt-2.5"
        />
      </div>
    </div>
  )
}

export default function RecapChatModal({
  open,
  onClose,
  recap,
  market,
  cadence,
}: RecapChatModalProps) {
  const [isDesktop, setIsDesktop] = useState(false)
  useScrollLock({ isLocked: open, isDesktop })

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const recapId = String(recap.id)
  const recapScope = `recap:${recapId}`

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
  } = useChatState(recapScope)

  useEffect(() => {
    const questions = recap.questions ?? []
    if (questions.length === 0) return

    const threadId = `recap-questions-${recapId}`
    const existing = threads.find((t) => t.question === 'Dig deeper into this recap')
    if (!existing) {
      updateThread(threadId, {
        id: threadId,
        question: 'Dig deeper into this recap',
        relatedQuestions: questions,
      })
    } else if (existing.relatedQuestions.length !== questions.length) {
      updateThread(existing.id, { relatedQuestions: questions })
    }
  }, [recap.questions, recapId, updateThread, threads])

  const { handleSubmit, isLoading, isThinking, cancelRequest } = useRecapChatAPI(
    recapId,
    updateThread,
    conversationId,
    setConversationId,
    recordActivity,
  )

  const handleFAQClick = async (question: string) => {
    const threadId = addThread(question)
    await handleSubmit(question, threadId, false, deepAnalysis, preferredModel)
  }

  const period = formatPeriodShort(recap.period_start, recap.period_end)
  const cadenceLabel = cadence === 'daily' ? 'Daily' : 'Weekly'

  if (!open) return null

  return (
    <ChatboxUI
      threads={threads}
      input={input}
      setInput={setInput}
      addThread={addThread}
      handleSubmit={(question: string, threadId: string) =>
        handleSubmit(question, threadId, false, deepAnalysis, preferredModel)
      }
      isLoading={isLoading}
      isThinking={isThinking}
      cancelRequest={cancelRequest}
      onClose={onClose}
      isDesktop={isDesktop}
      handleFAQClick={handleFAQClick}
      deepAnalysis={deepAnalysis}
      setDeepAnalysis={setDeepAnalysis}
      preferredModel={preferredModel}
      setPreferredModel={setPreferredModel}
      header={{
        icon: <Sparkles size={13} strokeWidth={2.4} />,
        title: `${market} ${cadenceLabel} Recap`,
        subtitle: period,
      }}
    >
      <RecapContextCard recap={recap} title={`${market} ${cadenceLabel} Recap`} />
    </ChatboxUI>
  )
}
