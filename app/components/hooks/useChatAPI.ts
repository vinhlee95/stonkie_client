import { useRef, useState } from 'react'
import { AnswerGround, AnswerSource, Thread } from './useChatState'
import { chatService } from '../services/chatService'

export const useChatAPI = (
  ticker: string | undefined,
  updateThread: (threadId: string, updates: Partial<Thread>) => void,
  conversationId: string | null = null,
  setConversationId: (id: string | null) => void = () => {},
  recordActivity: () => void = () => {},
) => {
  const [isLoading, setIsLoading] = useState(false)
  const isThinkingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsLoading(false)
      isThinkingRef.current = false
    }
  }

  const handleSubmit = async (
    question: string,
    threadId: string,
    useGoogleSearch: boolean = false,
    useUrlContext: boolean = false,
    deepAnalysis: boolean = false,
    preferredModel: string = 'fastest',
  ) => {
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    setIsLoading(true)
    isThinkingRef.current = true
    // Record activity when a question is asked
    recordActivity()
    try {
      const reader = await chatService.analyzeQuestion(
        question,
        ticker,
        useGoogleSearch,
        useUrlContext,
        deepAnalysis,
        preferredModel,
        conversationId,
        signal,
      )
      if (!reader) throw new Error('Failed to get reader')

      const decoder = new TextDecoder()
      let accumulatedContent = ''
      let thoughts: string[] = []
      let relatedQuestions: string[] = []
      let grounds: AnswerGround[] = []
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // Keep the last element as it may be incomplete
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const parsedChunk = JSON.parse(trimmed)
            if (parsedChunk.type === 'conversation') {
              // Handle conversation event - store conversationId
              const newConversationId = parsedChunk.body?.conversationId || null
              if (newConversationId) {
                setConversationId(newConversationId)
                // Record activity when conversation is established
                recordActivity()
              }
            } else if (parsedChunk.type === 'answer') {
              if (isThinkingRef.current) {
                isThinkingRef.current = false
              }
              accumulatedContent += parsedChunk.body
              updateThread(threadId, { answer: accumulatedContent })
            } else if (parsedChunk.type === 'thinking_status') {
              if (!isThinkingRef.current) {
                isThinkingRef.current = true
              }
              thoughts = [...thoughts, parsedChunk.body]
              updateThread(threadId, { thoughts })
            } else if (parsedChunk.type === 'related_question') {
              relatedQuestions = [...relatedQuestions, parsedChunk.body]
              updateThread(threadId, { relatedQuestions })
            } else if (parsedChunk.type === 'google_search_ground') {
              grounds = [...grounds, { body: parsedChunk.body, url: parsedChunk.url }]
              updateThread(threadId, { grounds })
            } else if (parsedChunk.type === 'sources') {
              if (Array.isArray(parsedChunk.body)) {
                const links = parsedChunk.body
                  .filter((s: { name: string; url?: string }) => s.url)
                  .map((s: { name: string; url: string }) => `[${s.name}](${s.url})`)
                  .join(' ')
                if (links) {
                  // Trim trailing newlines so links render inline with paragraph
                  const trimmed = accumulatedContent.replace(/\n+$/, '')
                  accumulatedContent = trimmed + ' ' + links + '\n\n'
                  updateThread(threadId, { answer: accumulatedContent })
                }
              }
            } else if (parsedChunk.type === 'sources_grouped') {
              const groupedSources: AnswerSource[] = (parsedChunk.body?.sources || [])
                .filter((s: { name: string; url?: string }) => s.url)
                .map((s: { name: string; url: string; paragraph_indices?: number[] }) => ({
                  name: s.name,
                  url: s.url,
                  paragraphIndices: s.paragraph_indices,
                }))
              updateThread(threadId, { sources: groupedSources })
            } else if (parsedChunk.type === 'model_used') {
              updateThread(threadId, { modelName: parsedChunk.body })
            } else if (parsedChunk.type === 'attachment_url') {
              updateThread(threadId, {
                attachment: {
                  title: parsedChunk.title || 'Attachment',
                  url: parsedChunk.body,
                },
              })
            }
          } catch (e) {
            console.error('Error parsing chunk:', e)
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const parsedChunk = JSON.parse(buffer.trim())
          if (parsedChunk.type === 'sources' && Array.isArray(parsedChunk.body)) {
            const links = parsedChunk.body
              .filter((s: { name: string; url?: string }) => s.url)
              .map((s: { name: string; url: string }) => `[${s.name}](${s.url})`)
              .join(' ')
            if (links) {
              const trimmed = accumulatedContent.replace(/\n+$/, '')
              accumulatedContent = trimmed + ' ' + links + '\n\n'
              updateThread(threadId, { answer: accumulatedContent })
            }
          } else if (parsedChunk.type === 'model_used') {
            updateThread(threadId, { modelName: parsedChunk.body })
          }
        } catch (e) {
          console.error('Error parsing remaining buffer:', e)
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        updateThread(threadId, {
          answer: 'Request cancelled.',
          thoughts: [],
          relatedQuestions: [],
        })
        return
      }

      console.error('Error in chat:', error)
      updateThread(threadId, {
        answer: 'Sorry, I encountered an error analyzing the data.',
        thoughts: [],
        relatedQuestions: [],
      })
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  return {
    handleSubmit,
    isLoading,
    isThinking: isThinkingRef.current,
    cancelRequest,
  }
}
