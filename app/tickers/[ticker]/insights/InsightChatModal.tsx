'use client'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'
import { InsightChatbox } from '@/app/components/Chat'
import InsightReport from './InsightReport'
import InsightHeader from './InsightHeader'

interface Insight {
  title: string
  content: string
  slug: string
  thumbnail_url: string
}

function truncateContent(content: string, maxWords: number = 30): string {
  const words = content.split(/\s+/)
  if (words.length <= maxWords) return content
  return words.slice(0, maxWords).join(' ') + '...'
}

export default function InsightChatModal({
  insights,
  ticker,
}: {
  insights: Insight[]
  ticker: string
}) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [currentInsight, setCurrentInsight] = useState<Insight | null>(null)

  const handleCardClick = (insight: Insight) => {
    setCurrentInsight(insight)
    setIsChatOpen(true)
  }

  if (isChatOpen && currentInsight) {
    // Support for insights with/without title in content
    const title = currentInsight.content.split('\n')[0]
    const titleWithoutMarkdown = currentInsight.title ?? title.replace(/^#+\s*|\*\*/g, '').trim()
    const contentWithoutTitle = currentInsight.title
      ? currentInsight.content
      : currentInsight.content.split('\n').slice(1).join('\n')
    return (
      <InsightChatbox onClose={() => setIsChatOpen(false)}>
        <InsightHeader
          imageUrl={currentInsight.thumbnail_url}
          title={titleWithoutMarkdown}
          recap={contentWithoutTitle}
        />
        <InsightReport ticker={ticker} slug={currentInsight.slug} />
      </InsightChatbox>
    )
  }

  return (
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-700/50 overflow-hidden transition-all hover:shadow-md cursor-pointer"
            onClick={() => handleCardClick(insight)}
          >
            {insight.thumbnail_url && (
              <div className="relative h-48 w-full">
                <Image
                  src={insight.thumbnail_url}
                  alt="Insight illustration"
                  fill
                  className="object-cover"
                  priority={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}
            <div className="p-6 whitespace-pre-wrap">
              <h2 className="text-xl font-bold">{insight.title}</h2>
              <ReactMarkdown>{truncateContent(insight.content)}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
