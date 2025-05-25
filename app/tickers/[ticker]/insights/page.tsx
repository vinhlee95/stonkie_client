'use client'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'
import Chat from '@/app/components/Chat'
import InsightReport from './InsightReport'
import InsightHeader from './InsightHeader'
import LoadingSkeleton from '@/app/components/LoadingSkeleton'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

enum InsightType {
  GROWTH = "growth",
  EARNINGS = "earnings",
  CASH_FLOW = "cash_flow"
}

const truncateContent = (content: string, maxWords: number = 30): string => {
  const words = content.split(/\s+/)
  if (words.length <= maxWords) return content
  return words.slice(0, maxWords).join(' ') + '...'
}

interface Insight {
  title?: string
  content: string;
  slug: string;
  source?: string;
  imageUrl: string;
}

export default function InsightsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const type = searchParams.get('type')
  const ticker = params.ticker as string
  const [insights, setInsights] = useState<Insight[]>([])
  const [currentInsight, setCurrentInsight] = useState<Insight | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const isFetching = useRef(false)

  useEffect(() => {
    const fetchInsights = async () => {
      if (isFetching.current) return
      isFetching.current = true
      setIsLoading(true)
      setInsights([])
      setCurrentInsight(null)

      const insightType = Object.values(InsightType).includes(type as InsightType) ? type : InsightType.GROWTH

      try {
        const response = await fetch(`${BACKEND_URL}/api/companies/${ticker}/insights/${insightType}`)
        const reader = response.body?.getReader()
        if (!reader) return

        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            setIsLoading(false)
            break
          }

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                const parsed = JSON.parse(line)
                if (parsed.type === 'success' && parsed.data?.content) {
                  // Extract source if present
                  const content = parsed.data.content
                  const sourceMatch = content.match(/Source: (.*)$/m)
                  const insightContent = sourceMatch ? content.slice(0, sourceMatch.index).trim() : content
                  const source = sourceMatch ? sourceMatch[1].trim() : ''

                  setInsights(prev => [...prev, { 
                    title: parsed.data.title,
                    content: insightContent, 
                    source,
                    imageUrl: parsed.data.imageUrl,
                    slug: parsed.data.slug
                  }])
                  setCurrentInsight(null)
                } else if (parsed.type === 'stream' && parsed.content) {
                  setCurrentInsight(prev => {
                    if (prev) {
                      return {
                        ...prev,
                        content: prev.content + parsed.content
                      }
                    }
                    return null
                  })
                }
              } catch (e) {
                console.error('Error parsing data:', e)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching insights:', error)
        setIsLoading(false)
      } finally {
        isFetching.current = false
      }
    }

    fetchInsights()
  }, [ticker])
  
  if (isChatOpen && currentInsight) {
    // A bit complicated logic to support some old insights do not have any title
    const title = currentInsight.content.split('\n')[0];
    const titleWithoutMarkdown = currentInsight.title ?? title.replace(/^#+\s*|\*\*/g, '').trim();
    const contentWithoutTitle = currentInsight.title ? currentInsight.content : currentInsight.content.split('\n').slice(1).join('\n');

    return (
      <Chat 
        onClose={() => setIsChatOpen(false)} 
        initialState={{ 
          content: currentInsight.content, 
          slug: currentInsight.slug, 
          imageUrl: currentInsight.imageUrl
        }} 
      >
        <InsightHeader imageUrl={currentInsight.imageUrl} title={titleWithoutMarkdown} recap={contentWithoutTitle} />
        <InsightReport ticker={ticker} slug={currentInsight.slug} />
      </Chat>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading && insights.length === 0 ? (
          <>
            {[...Array(4)].map((_, index) => (
              <div key={index} className="rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-700/50 overflow-hidden">
                <div className="p-6">
                  <LoadingSkeleton />
                </div>
              </div>
            ))}
          </>
          ) : insights.length > 0 ? (
            <>
              {insights.map((insight, index) => (
                <div 
                  key={index} 
                  className="rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-700/50 overflow-hidden transition-all hover:shadow-md cursor-pointer"
                  onClick={() => {
                    setIsChatOpen(true)
                    setCurrentInsight(insight)
                  }}
                >
                  {insight.imageUrl && (
                    <div className="relative h-48 w-full">
                      <Image
                        src={insight.imageUrl}
                        alt="Insight illustration"
                        fill
                        className="object-cover"
                        // This image is LCP -> preload the image to improve LCP
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
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 col-span-full">
              No insights available for this company.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}