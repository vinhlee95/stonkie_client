import { useState, useRef, useEffect, useCallback } from 'react'

export interface AnswerGround {
  body: string
  url: string
}

export interface FaqThread {
  id: string
  question: string
  relatedQuestions: string[]
}

export interface NormalThread {
  id: string
  question: string
  thoughts: string[]
  answer: string | null
  relatedQuestions: string[]
  grounds: AnswerGround[]
  modelName: string | undefined
  attachmentUrl: string | undefined
}

export type Thread = FaqThread | NormalThread

// Typeguards
export const isFaqThread = (thread: Thread): thread is FaqThread => {
  return !('thoughts' in thread) && !('answer' in thread) && !('grounds' in thread)
}

export const isNormalThread = (thread: Thread): thread is NormalThread => {
  return 'thoughts' in thread && 'answer' in thread && 'grounds' in thread
}

export const useChatState = (ticker: string | undefined) => {
  const [threads, setThreads] = useState<Thread[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const hasFetchedFAQs = useRef(false)
  const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(false)

  // Debug logging for ticker changes
  const prevTickerRef = useRef<string | undefined>(ticker)

  useEffect(() => {
    if (ticker !== prevTickerRef.current) {
      setThreads([])
      setCurrentThreadId(null)
      prevTickerRef.current = ticker
    }
  }, [ticker])

  const addThread = useCallback((question: string) => {
    const newThread: NormalThread = {
      id: Date.now().toString(),
      question,
      thoughts: [],
      answer: null,
      relatedQuestions: [],
      grounds: [],
      modelName: undefined,
      attachmentUrl: undefined,
    }
    setThreads((prev) => {
      return [...prev, newThread]
    })
    setCurrentThreadId(newThread.id)
    return newThread.id
  }, [])

  const updateThread = useCallback((threadId: string, updates: Partial<Thread>) => {
    setThreads((prev) => {
      const threadIndex = prev.findIndex((t) => t.id === threadId)
      const isNewThread = threadIndex === -1

      if (isNewThread) {
        // Determine thread type based on updates
        // If it has normal thread properties, create normal thread
        if ('thoughts' in updates || 'answer' in updates || 'grounds' in updates) {
          const newThread: NormalThread = {
            id: threadId,
            question: updates.question || '',
            thoughts: (updates as Partial<NormalThread>).thoughts || [],
            answer: (updates as Partial<NormalThread>).answer || null,
            relatedQuestions: updates.relatedQuestions || [],
            grounds: (updates as Partial<NormalThread>).grounds || [],
            modelName: (updates as Partial<NormalThread>).modelName || undefined,
          }
          return [...prev, newThread]
        }

        // Create FAQ thread
        const newThread: FaqThread = {
          id: threadId,
          question: updates.question || '',
          relatedQuestions: updates.relatedQuestions || [],
        }
        return [...prev, newThread]
      }

      // Update existing thread
      const updatedThreads = [...prev]
      const existingThread = updatedThreads[threadIndex]

      updatedThreads[threadIndex] = {
        ...existingThread,
        ...updates,
      }

      return updatedThreads
    })
  }, [])

  return {
    threads,
    currentThreadId,
    setCurrentThreadId,
    input,
    setInput,
    hasFetchedFAQs,
    addThread,
    updateThread,
    useGoogleSearch,
    setUseGoogleSearch,
  }
}
