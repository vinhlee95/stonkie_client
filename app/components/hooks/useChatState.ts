import { useState, useRef, useEffect, useCallback } from 'react'

export interface AnswerGround {
  body: string
  url: string
}

export interface AnswerSource {
  name: string
  url: string
}

export interface Attachment {
  title: string
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
  sources: AnswerSource[]
  modelName: string | undefined
  attachment: Attachment | undefined
}

export type Thread = FaqThread | NormalThread

// Typeguards
export const isFaqThread = (thread: Thread): thread is FaqThread => {
  return !('thoughts' in thread) && !('answer' in thread) && !('grounds' in thread)
}

export const isNormalThread = (thread: Thread): thread is NormalThread => {
  return 'thoughts' in thread && 'answer' in thread && 'grounds' in thread && 'sources' in thread
}

const STORAGE_KEY = 'stonkie-preferred-model'
const DEFAULT_MODEL = 'fastest'
const CONVERSATION_KEY_PREFIX = 'stonkie_conversation_'
const ACTIVITY_TIMESTAMP_PREFIX = 'stonkie_activity_'
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

export const useChatState = (ticker: string | undefined) => {
  const [threads, setThreads] = useState<Thread[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(false)
  const [deepAnalysis, setDeepAnalysis] = useState<boolean>(false)

  // Initialize conversationId from localStorage (hybrid approach)
  const [conversationId, setConversationIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && ticker) {
      return localStorage.getItem(`${CONVERSATION_KEY_PREFIX}${ticker}`) || null
    }
    return null
  })

  // Initialize preferredModel from localStorage
  const [preferredModel, setPreferredModelState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored || DEFAULT_MODEL
    }
    return DEFAULT_MODEL
  })

  // Persist preferredModel to localStorage when it changes
  const setPreferredModel = useCallback((model: string) => {
    setPreferredModelState(model)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, model)
    }
  }, [])

  // Function to record activity timestamp
  const recordActivity = useCallback(() => {
    if (typeof window !== 'undefined' && ticker) {
      localStorage.setItem(`${ACTIVITY_TIMESTAMP_PREFIX}${ticker}`, Date.now().toString())
    }
  }, [ticker])

  // Function to set conversationId (updates both state and localStorage)
  const setConversationId = useCallback(
    (id: string | null) => {
      setConversationIdState(id)
      if (typeof window !== 'undefined' && ticker) {
        if (id) {
          localStorage.setItem(`${CONVERSATION_KEY_PREFIX}${ticker}`, id)
          // Record activity when setting a new conversationId
          recordActivity()
        } else {
          localStorage.removeItem(`${CONVERSATION_KEY_PREFIX}${ticker}`)
          localStorage.removeItem(`${ACTIVITY_TIMESTAMP_PREFIX}${ticker}`)
        }
      }
    },
    [ticker, recordActivity],
  )

  // Function to check and clear conversationId if inactive
  const checkInactivity = useCallback(() => {
    if (typeof window !== 'undefined' && ticker && conversationId) {
      const activityKey = `${ACTIVITY_TIMESTAMP_PREFIX}${ticker}`
      const lastActivityStr = localStorage.getItem(activityKey)

      if (lastActivityStr) {
        const lastActivity = parseInt(lastActivityStr, 10)
        const now = Date.now()
        const timeSinceActivity = now - lastActivity

        if (timeSinceActivity >= INACTIVITY_TIMEOUT_MS) {
          // Clear conversationId after 15 minutes of inactivity
          setConversationId(null)
        }
      }
    }
  }, [ticker, conversationId, setConversationId])

  // Update conversationId when ticker changes and check for expired conversations
  useEffect(() => {
    if (typeof window !== 'undefined' && ticker) {
      const stored = localStorage.getItem(`${CONVERSATION_KEY_PREFIX}${ticker}`)
      const activityKey = `${ACTIVITY_TIMESTAMP_PREFIX}${ticker}`
      const lastActivityStr = localStorage.getItem(activityKey)

      if (stored && lastActivityStr) {
        const lastActivity = parseInt(lastActivityStr, 10)
        const now = Date.now()
        const timeSinceActivity = now - lastActivity

        if (timeSinceActivity >= INACTIVITY_TIMEOUT_MS) {
          // Conversation expired, clear it
          localStorage.removeItem(`${CONVERSATION_KEY_PREFIX}${ticker}`)
          localStorage.removeItem(activityKey)
          // Use setTimeout to avoid calling setState synchronously in effect
          setTimeout(() => setConversationId(null), 0)
        } else {
          // Use setTimeout to avoid calling setState synchronously in effect
          setTimeout(() => setConversationIdState(stored), 0)
        }
      } else {
        // Use setTimeout to avoid calling setState synchronously in effect
        setTimeout(() => setConversationIdState(stored || null), 0)
      }
    } else {
      // Use setTimeout to avoid calling setState synchronously in effect
      setTimeout(() => setConversationIdState(null), 0)
    }
  }, [ticker, setConversationId])

  // Set up interval to check for inactivity
  useEffect(() => {
    if (!ticker || !conversationId) return

    // Check immediately (defer to avoid calling setState synchronously in effect)
    const timeoutId = setTimeout(() => {
      checkInactivity()
    }, 0)

    // Check every minute
    const interval = setInterval(checkInactivity, 60 * 1000)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(interval)
    }
  }, [ticker, conversationId, checkInactivity])

  // Clear conversationId on browser close
  useEffect(() => {
    if (typeof window === 'undefined' || !ticker) return

    const handleBeforeUnload = () => {
      // Clear conversationId for this ticker on browser close
      localStorage.removeItem(`${CONVERSATION_KEY_PREFIX}${ticker}`)
      localStorage.removeItem(`${ACTIVITY_TIMESTAMP_PREFIX}${ticker}`)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [ticker])

  // Function to start a new conversation (clear conversationId)
  const startNewConversation = useCallback(() => {
    setConversationId(null)
  }, [setConversationId])

  // Debug logging for ticker changes
  const prevTickerRef = useRef<string | undefined>(ticker)

  useEffect(() => {
    if (ticker !== prevTickerRef.current) {
      // Use setTimeout to avoid calling setState synchronously in effect
      setTimeout(() => {
        setThreads([])
        setCurrentThreadId(null)
      }, 0)
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
      sources: [],
      modelName: undefined,
      attachment: undefined,
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
            sources: (updates as Partial<NormalThread>).sources || [],
            modelName: (updates as Partial<NormalThread>).modelName || undefined,
            attachment: (updates as Partial<NormalThread>).attachment || undefined,
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
    addThread,
    updateThread,
    useGoogleSearch,
    setUseGoogleSearch,
    deepAnalysis,
    setDeepAnalysis,
    preferredModel,
    setPreferredModel,
    conversationId,
    setConversationId,
    startNewConversation,
    recordActivity,
  }
}
