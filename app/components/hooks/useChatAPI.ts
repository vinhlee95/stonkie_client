import { useRef, useState } from 'react'
import { AnswerGround, Thread } from './useChatState'
import { chatService } from '../services/chatService'

export const useChatAPI = (
  ticker: string | undefined,
  updateThread: (threadId: string, updates: Partial<Thread>) => void,
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
    try {
      const reader = await chatService.analyzeQuestion(
        question,
        ticker,
        useGoogleSearch,
        useUrlContext,
        deepAnalysis,
        preferredModel,
        signal,
      )
      if (!reader) throw new Error('Failed to get reader')

      const decoder = new TextDecoder()
      let accumulatedContent = ''
      let thoughts: string[] = []
      let relatedQuestions: string[] = []
      let grounds: AnswerGround[] = []

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        try {
          const jsonStrings = chunk.split('\n').filter((str) => str.trim())
          for (const jsonStr of jsonStrings) {
            const parsedChunk = JSON.parse(jsonStr)
            if (parsedChunk.type === 'answer') {
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
          }
        } catch (e) {
          console.error('Error parsing chunk:', e)
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
