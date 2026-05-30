import { useQuery } from '@tanstack/react-query'
import { chatService } from '../services/chatService'

/**
 * Fetches FAQs for a given ticker.
 * Disabled when no ticker is provided (Home route uses Smart Brief instead).
 */
export function useFAQQuery(ticker: string | undefined) {
  return useQuery({
    queryKey: ['faqs', ticker],
    enabled: !!ticker,
    queryFn: async (): Promise<string[]> => {
      const reader = await chatService.fetchFAQs(ticker)
      if (!reader) {
        throw new Error('Failed to get reader')
      }

      const decoder = new TextDecoder()
      const questions: string[] = []

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (line.trim()) {
            const jsonString = line.replace(/^data: /, '')
            try {
              const data = JSON.parse(jsonString)
              switch (data.type) {
                case 'question':
                  questions.push(data.text)
                  break
                case 'error':
                  throw new Error(data.message || 'Error fetching FAQs')
              }
            } catch (e) {
              if (e instanceof Error) throw e
              console.error('Error parsing FAQ data:', e)
            }
          }
        }
      }

      return questions
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
