'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

interface Insight {
  content: string;
  source?: string;
}

export default function InsightContent({type}: {type: 'growth' | 'earning' | 'cash_flow'}) {
  const ticker = useParams().ticker
  const [insights, setInsights] = useState<Insight[]>([])
  const [currentInsight, setCurrentInsight] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const isFetching = useRef(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchInsights = async () => {
      if (isFetching.current) return
      isFetching.current = true

      try {
        const response = await fetch(`${BACKEND_URL}/api/companies/${ticker}/insights/${type}`)
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
                  const source = sourceMatch ? sourceMatch[1].trim() : undefined

                  setInsights(prev => [...prev, { content: insightContent, source }])
                  setCurrentInsight('')
                } else if (parsed.type === 'stream' && parsed.content) {
                  setCurrentInsight(prev => prev + parsed.content)
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
  }, [ticker, type])

  return (
    <div className="overflow-y-auto pr-4 px-4 mt-4">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{type.charAt(0).toUpperCase() + type.slice(1)} Insights for {ticker}</h1>
        {isLoading && insights.length === 0 ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : insights.length > 0 || currentInsight ? (
          <div ref={contentRef} className="space-y-4">
            {insights.map((insight, index) => (
              <div 
                key={index} 
                className="rounded-xl shadow-sm p-6 whitespace-pre-wrap border border-gray-100"
              >
                <ReactMarkdown>{insight.content}</ReactMarkdown>
                {insight.source && (
                  <div className="mt-2 text-sm text-gray-500">
                    Source: {insight.source}
                  </div>
                )}
              </div>
            ))}
            {currentInsight && (
              <div className="rounded-xl shadow-sm p-6 whitespace-pre-wrap border border-gray-100">
                <ReactMarkdown>{currentInsight}</ReactMarkdown>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No insights available for this company.
          </div>
        )}
      </div>
    </div>
  )
}