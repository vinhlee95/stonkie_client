'use client'
import React, { useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useChatState } from './hooks/useChatState'
import { useChatAPI } from './hooks/useChatAPI'
import { FileText } from 'lucide-react'
import { ChatboxUI } from './Chat'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

interface FilingChatboxProps {
  onClose: () => void
  filingName: string
  filingUrl: string
  isDesktop?: boolean
}

const FilingChatbox: React.FC<FilingChatboxProps> = ({
  onClose,
  filingName,
  filingUrl,
  isDesktop = false,
}) => {
  const params = useParams()
  // const ticker = params.ticker as string | undefined
  const ticker = useMemo(() => params.ticker as string | undefined, [params.ticker])
  const hasFetchedAnalysis = useRef(false)
  const currentAnswerRef = useRef('')
  const isFetchingAnalysisRef = useRef(false)

  const { threads, input, setInput, addThread, updateThread, useGoogleSearch, setUseGoogleSearch } =
    useChatState(ticker)

  const {
    isLoading,
    cancelRequest,
    handleSubmit,
    isThinking: isAnsweringNextQuestion,
  } = useChatAPI(ticker, updateThread)

  // Extract period from filing name (e.g., "Form 10-K 2024" -> "2024")
  const extractPeriod = (name: string) => {
    const match = name.match(/(\d{4})/)
    return match ? match[1] : '2024'
  }

  // Determine if it's quarterly based on filing name
  const isQuarterly = filingName.includes('10-Q')
  const period = extractPeriod(filingName)
  const periodType = isQuarterly ? 'quarterly' : 'annually'

  const fetchFilingAnalysis = useCallback(async () => {
    if (!ticker) return

    // Create the analysis thread
    const threadId = addThread('')
    currentAnswerRef.current = ''
    isFetchingAnalysisRef.current = true

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/companies/${ticker.toUpperCase()}/reports/analyze?period_end_at=${period}&period_type=${periodType}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('ReadableStream not yet supported in this browser.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let thoughts: string[] = []
      const relatedQuestions: string[] = []

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })

        // Process complete JSON objects from the buffer
        let startIndex = 0
        while (true) {
          const lineStart = buffer.indexOf('data: ', startIndex)
          if (lineStart === -1) {
            buffer = buffer.slice(startIndex)
            break
          }

          const dataStart = lineStart + 6 // length of 'data: '
          const lineEnd = buffer.indexOf('\n', dataStart)
          if (lineEnd === -1) {
            buffer = buffer.slice(startIndex)
            break
          }

          const jsonStr = buffer.slice(dataStart, lineEnd).trim()
          if (jsonStr) {
            try {
              const data = JSON.parse(jsonStr)

              if (data.type === 'thinking_status') {
                thoughts = [...thoughts, data.body]
                // Update thoughts
                updateThread(threadId, { thoughts })
              } else if (data.type === 'answer') {
                isFetchingAnalysisRef.current = false
                // Accumulate answer content
                currentAnswerRef.current += data.body
                updateThread(threadId, {
                  answer: currentAnswerRef.current,
                })
              } else if (data.type == 'related_question') {
                // Update related questions
                relatedQuestions.push(data.body)
                updateThread(threadId, { relatedQuestions })
              }
            } catch (e) {
              console.error('Error parsing JSON chunk:', e)
            }
          }
          startIndex = lineEnd + 1
        }
      }
    } catch (error) {
      console.error('Error fetching filing analysis:', error)
      updateThread(threadId, {
        answer: 'Error loading analysis. Please try again.',
      })
    } finally {
      if (isFetchingAnalysisRef.current) {
        isFetchingAnalysisRef.current = false
      }
    }
  }, [ticker, period, periodType, addThread, updateThread])

  const addCompanySpecificContext = (question: string): string => {
    return `${question}. Here is the 10K filing URL: ${filingUrl}. This question is specifically for company ${ticker}, not a general finance question.`
  }

  const handleFAQClick = async (question: string) => {
    const threadId = addThread(question)
    const questionWithFilingContext = addCompanySpecificContext(question)
    await handleSubmit(questionWithFilingContext, threadId)
  }

  const handleSubmitNewQuestion = async (question: string, threadId: string) => {
    const questionWithFilingContext = addCompanySpecificContext(question)
    await handleSubmit(questionWithFilingContext, threadId)
  }

  useEffect(() => {
    if (!hasFetchedAnalysis.current && ticker) {
      hasFetchedAnalysis.current = true
      fetchFilingAnalysis()
    }
  }, [ticker, fetchFilingAnalysis])

  useEffect(() => {
    // When chat is visible, disable body scroll
    if (!isDesktop) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      // When chat is hidden, restore body scroll
      document.body.style.overflow = ''
    }
  }, [isDesktop])

  // Filing Header component
  const FilingHeader = () => (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-6 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <FileText size={24} className="text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Analysis of {filingName}
        </h3>
      </div>
      <a
        href={filingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
      >
        View original filing →
      </a>
    </div>
  )

  return (
    <ChatboxUI
      threads={threads}
      input={input}
      setInput={setInput}
      addThread={addThread}
      handleSubmit={handleSubmitNewQuestion}
      isLoading={isLoading}
      isThinking={isFetchingAnalysisRef.current || isAnsweringNextQuestion}
      cancelRequest={cancelRequest}
      onClose={onClose}
      isDesktop={isDesktop}
      handleFAQClick={handleFAQClick}
      useGoogleSearch={useGoogleSearch}
      setUseGoogleSearch={setUseGoogleSearch}
    >
      <FilingHeader />
    </ChatboxUI>
  )
}

export default FilingChatbox
