'use client'

import { ArrowLeft, ListPlus } from 'lucide-react'
import SourceChip from '../SourceChip'
import RecapCuratedChip from '../RecapCuratedChip'
import QuestionRow from './QuestionRow'
import RecapAudioControls from './RecapAudioControls'
import type { BriefMarketData } from '../hooks/useBriefData'

const BULLET_COLORS = ['bg-blue-600', 'bg-amber-600', 'bg-rose-600', 'bg-emerald-700']

interface RecapDetailViewProps {
  market: BriefMarketData
  onAskQuestion: (question: string) => void
  onBackToBrief: () => void
}

export default function RecapDetailView({
  market,
  onAskQuestion,
  onBackToBrief,
}: RecapDetailViewProps) {
  const { recap } = market
  if (!recap) return null

  const sourceById = new Map(recap.sources.map((s) => [s.id, s]))
  const questions = recap.questions ?? []

  return (
    <div className="pb-4">
      {/* Listen to the narrated version */}
      <RecapAudioControls
        audio={recap.audio}
        trackId={`brief:market:${market.market.key}:${recap.id}`}
        title={`${market.market.label} recap`}
        className="mb-3"
      />

      {/* Summary */}
      <p className="text-base md:text-lg leading-7 text-gray-700 dark:text-gray-200">
        {recap.summary}
      </p>

      {/* Bullets */}
      {recap.bullets.length > 0 && (
        <div className="mt-4 space-y-2">
          {recap.bullets.map((bullet, i) => (
            <div key={`${bullet.text}-${i}`} className="flex items-start gap-2.5 pb-2">
              <span
                className={`mt-2.5 h-2 w-2 shrink-0 rounded-full ring-1 ring-white/70 dark:ring-black/25 ${BULLET_COLORS[i % BULLET_COLORS.length]}`}
              />
              <div className="text-base md:text-lg leading-7 text-gray-700 dark:text-gray-200">
                <span>{bullet.text}</span>
                {bullet.citations.map((citation, ci) => {
                  const source = sourceById.get(citation.source_id)
                  if (!source?.url) return null
                  return (
                    <span key={`${i}-${citation.source_id}-${ci}`} className="ml-1.5 inline-flex">
                      <SourceChip
                        source={{
                          url: source.url,
                          title: source.title,
                          publisher: source.publisher,
                          publishedAt: source.published_at,
                        }}
                      />
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Curated timestamp */}
      <RecapCuratedChip createdAt={recap.created_at} className="mt-3" />

      {/* Related questions */}
      {questions.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-1.5 mb-1">
            <ListPlus size={16} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Related</span>
          </div>
          <div className="space-y-1.5">
            {questions.map((q, i) => (
              <QuestionRow key={i} question={q} onAsk={onAskQuestion} />
            ))}
          </div>
        </div>
      )}

      {/* Back to brief */}
      <button
        onClick={onBackToBrief}
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-[var(--accent-active)] dark:text-[var(--accent-active-dark)] font-semibold hover:underline cursor-pointer"
      >
        <ArrowLeft size={14} />
        Back to brief
      </button>
    </div>
  )
}
