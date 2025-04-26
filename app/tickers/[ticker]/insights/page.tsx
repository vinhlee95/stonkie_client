'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'
import Chat from '@/app/components/Chat'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY

const truncateContent = (content: string, maxWords: number = 30): string => {
  const words = content.split(/\s+/)
  if (words.length <= maxWords) return content
  return words.slice(0, maxWords).join(' ') + '...'
}

interface Insight {
  content: string;
  slug: string;
  source?: string;
  imageUrl?: string;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export default function InsightsPage() {
  const params = useParams()
  const ticker = params.ticker as string
  const [insights, setInsights] = useState<Insight[]>([])
  const [currentInsight, setCurrentInsight] = useState<Insight | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const isFetching = useRef(false)

  const getCachedImages = (insightType: string): string[] => {
    try {
      const cached = localStorage.getItem(`unsplash_${ticker}_${insightType}`)
      if (!cached) return []

      const { urls, timestamp }: { urls: string[], timestamp: number } = JSON.parse(cached)
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(`unsplash_${ticker}_${insightType}`)
        return []
      }

      return urls
    } catch (error) {
      console.error('Error reading from cache:', error)
      return []
    }
  }

  const setCachedImages = (insightType: string, urls: string[]) => {
    try {
      const cache = {
        urls,
        timestamp: Date.now()
      }
      localStorage.setItem(`unsplash_${ticker}_${insightType}`, JSON.stringify(cache))
    } catch (error) {
      console.error('Error writing to cache:', error)
    }
  }

  useEffect(() => {
    const fetchInsights = async () => {
      if (isFetching.current) return
      isFetching.current = true
      setIsLoading(true)
      setInsights([])
      setCurrentInsight(null)

      try {
        const response = await fetch(`${BACKEND_URL}/api/companies/${ticker}/insights/growth`)
        const reader = response.body?.getReader()
        if (!reader) return

        const decoder = new TextDecoder()
        let insightCount = 0

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

                  // Get cached images or fetch new ones if needed
                  const cachedImages = getCachedImages('growth')
                  let imageUrl = ''
                  
                  if (cachedImages.length > insightCount) {
                    imageUrl = cachedImages[insightCount]
                  } else {
                    // Fetch a single new image
                    const imageTypes = ['stock', 'product', 'headquarters']
                    const query = `${ticker} ${imageTypes[insightCount % imageTypes.length]}`
                    const params = new URLSearchParams({
                      query: query,
                      per_page: '1',
                      orientation: 'landscape'
                    })

                    const imageResponse = await fetch(
                      `https://api.unsplash.com/search/photos?${params.toString()}`,
                      {
                        headers: {
                          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                        }
                      }
                    )
                    const imageData = await imageResponse.json()
                    imageUrl = imageData.results[0]?.urls.regular || ''
                    
                    // Update cache with new image
                    setCachedImages('growth', [...cachedImages, imageUrl])
                  }

                  setInsights(prev => [...prev, { 
                    content: insightContent, 
                    source,
                    imageUrl,
                    slug: parsed.data.slug
                  }])
                  insightCount++
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
    return <Chat onClose={() => setIsChatOpen(false)} initialState={{ content: currentInsight.content, slug: currentInsight.slug }} />
  }

  return (
    <div className="container mx-auto">
      <div className="overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading && insights.length === 0 ? (
            <div className="flex items-center justify-center min-h-[200px] col-span-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
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
                      />
                    </div>
                  )}
                  <div className="p-6 whitespace-pre-wrap">
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