'use client'
import React, { useEffect, useRef, useContext, createContext, ReactNode, useState } from 'react'
import { useParams } from 'next/navigation'
import { FileSearch, Cpu, FileText, Sun, ArrowLeft, Minus, ListPlus } from 'lucide-react'
import ChatHeader from './ChatHeader'
import ChatInput from './ChatInput'
import { useChatState, Thread, isNormalThread } from './hooks/useChatState'
import { useChatAPI } from './hooks/useChatAPI'
import { useRecapChatAPI } from './hooks/useRecapChatAPI'
import { useFAQQuery } from './hooks/useFAQQuery'
import { useFavourites } from './hooks/useFavourites'
import { useBriefMarkets } from './hooks/useBriefMarkets'
import { useBriefData } from './hooks/useBriefData'
import QuestionRow from './chat/QuestionRow'
import SmartBriefPanel from './chat/SmartBriefPanel'
import RecapDetailView from './chat/RecapDetailView'
import type { Company } from '@/app/CompanyList'
import { ThoughtBubble } from './ThoughtBubble'
import AnswerContent from './AnswerContent'
import ResourceChips from './ResourceChips'
import ChatSourceChips from './ChatSourceChips'

// Compose the context type from useChatState and useChatAPI return types
type ChatStateType = ReturnType<typeof useChatState>
type ChatAPIType = ReturnType<typeof useChatAPI>
export type ChatContextType = ChatStateType & ChatAPIType

export const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const params = useParams()
  const ticker = params.ticker as string | undefined
  const chatState = useChatState(ticker)
  const chatAPI = useChatAPI(
    ticker,
    chatState.updateThread,
    chatState.conversationId,
    chatState.setConversationId,
    chatState.recordActivity,
  )
  const { data: faqQuestions } = useFAQQuery(ticker)
  const faqProcessedRef = useRef<string | null>(null)

  // Create FAQ thread when FAQs are loaded (only on ticker pages, not Home)
  useEffect(() => {
    if (!ticker) return
    if (faqQuestions && faqQuestions.length > 0) {
      const threadId = `faq-${ticker}`

      // Only process if we haven't already processed FAQs for this ticker
      if (faqProcessedRef.current !== threadId) {
        // Check if FAQ thread already exists
        const existingFAQThread = chatState.threads.find(
          (thread) => thread.question === 'Frequently Asked Questions',
        )

        if (!existingFAQThread) {
          chatState.updateThread(threadId, {
            id: threadId,
            question: 'Frequently Asked Questions',
            relatedQuestions: faqQuestions,
          })
          faqProcessedRef.current = threadId
        } else if (existingFAQThread.relatedQuestions.length !== faqQuestions.length) {
          // Update if FAQs have changed
          chatState.updateThread(existingFAQThread.id, {
            relatedQuestions: faqQuestions,
          })
          faqProcessedRef.current = threadId
        }
      }
    }
  }, [faqQuestions, ticker, chatState])

  // Reset ref when ticker changes
  useEffect(() => {
    faqProcessedRef.current = null
  }, [ticker])

  return (
    <ChatContext.Provider value={{ ...chatState, ...chatAPI }}>{children}</ChatContext.Provider>
  )
}

interface FinancialChatboxProps {
  onClose: () => void
  children?: React.ReactNode
  isDesktop?: boolean
  /** When true, plays the modal slide-down exit animation. */
  isClosing?: boolean
}

interface ThreadViewProps {
  thread: Thread
  onFAQClick: (question: string) => void
  isLastThread: boolean
  isThinking: boolean
}

export const ThreadView: React.FC<ThreadViewProps> = ({
  thread,
  onFAQClick,
  isLastThread,
  isThinking,
}) => {
  return (
    <div className="mb-8">
      <div className="text-2xl font-medium mb-2">{thread.question}</div>
      {isNormalThread(thread) && thread.attachment && (
        <div className="mt-4 mb-4">
          <a
            href={thread.attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            <FileText className="w-4 h-4" />
            <span>{thread.attachment.title}</span>
          </a>
        </div>
      )}

      {/* Do not show AI thought in first FAQ section and skip for FAQ threads */}
      {isNormalThread(thread) && (
        <div className="mb-4">
          {/* Only show thoughts bubble in the latest thread so that bubble from previous threads do not change */}
          <ThoughtBubble thoughts={thread.thoughts} isThinking={isThinking && isLastThread} />
        </div>
      )}
      {/* Only show answer for normal threads */}
      {isNormalThread(thread) && (thread.answer || thread.visualBlocks.length > 0) && (
        <AnswerContent content={thread.answer || ''} visualBlocks={thread.visualBlocks} />
      )}

      {/* Show sources (grouped citations from answer) */}
      {isNormalThread(thread) && thread.sources && thread.sources.length > 0 && (
        <>
          <div className="flex gap-1.5 items-center my-4">
            <FileSearch className="w-5 h-5" />
            <div className="font-semibold">Sources</div>
          </div>
          <ChatSourceChips sources={thread.sources} />
        </>
      )}

      {/* Show grounds (Google search) — only if no grouped sources */}
      {isNormalThread(thread) &&
        (!thread.sources || thread.sources.length === 0) &&
        thread.grounds &&
        thread.grounds.length > 0 && (
          <>
            <div className="flex gap-1.5 items-center my-4">
              <FileSearch className="w-5 h-5" />
              <div className="font-semibold">Sources</div>
            </div>
            <ResourceChips resources={thread.grounds.map((i) => ({ url: i.url, label: i.body }))} />
          </>
        )}

      {isNormalThread(thread) && thread.modelName && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
          <Cpu className="h-3.5 w-3.5" />
          <span>{thread.modelName}</span>
        </div>
      )}

      {thread.relatedQuestions.length > 0 && (
        <div>
          {isNormalThread(thread) && (
            <div className="flex items-center gap-1.5 mt-6 mb-1">
              <ListPlus size={16} />
              <div className="font-semibold">Related</div>
            </div>
          )}
          <div className="space-y-1.5">
            {thread.relatedQuestions.map((question, index) => (
              <QuestionRow key={index} question={question} onAsk={onFAQClick} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface ChatboxUIProps {
  threads: Thread[]
  input: string
  setInput: (input: string) => void
  addThread: (question: string) => string
  handleSubmit: (question: string, threadId: string) => Promise<void>
  isLoading: boolean
  isThinking: boolean
  cancelRequest: () => void
  children?: React.ReactNode
  onClose: () => void
  isDesktop?: boolean
  handleFAQClick: (question: string) => void
  deepAnalysis: boolean
  setDeepAnalysis: React.Dispatch<React.SetStateAction<boolean>>
  preferredModel: string
  setPreferredModel: (model: string) => void
  placeholder?: string
  headerContent?: React.ReactNode
  /** When true, plays the slide-down exit animation before unmounting. */
  isClosing?: boolean
}

export const ChatboxUI: React.FC<ChatboxUIProps> = ({
  threads,
  input,
  setInput,
  addThread,
  handleSubmit,
  isLoading,
  isThinking,
  cancelRequest,
  children,
  onClose,
  isDesktop,
  handleFAQClick,
  deepAnalysis,
  setDeepAnalysis,
  preferredModel,
  setPreferredModel,
  placeholder,
  headerContent,
  isClosing,
}) => {
  const latestThreadRef = useRef<HTMLDivElement>(null)
  const [isMaximized, setIsMaximized] = useState(false)
  const [isCursorOnChat, setIsCursorOnChat] = useState(false)
  // Entrance animation: start off-screen (translate-y-full), then flip to 0 after
  // first paint so the transition slides the sheet up from the bottom.
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true))
    })
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleMaximize = () => setIsMaximized((prev) => !prev)

  // Prevent vertical scrolling of main page when cursor is on the chat window (keep scrollbar visible if it exists)
  useEffect(() => {
    if (isCursorOnChat) {
      // Store current scroll position
      const scrollY = window.scrollY

      // Check if scrollbar exists before applying position: fixed
      // Once position: fixed is applied, scrollHeight may change, so we check beforehand
      const hasScrollbar =
        document.documentElement.scrollHeight > document.documentElement.clientHeight

      // Apply styles to body to prevent scrolling
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      // Only show scrollbar if it existed before, otherwise keep it hidden
      document.body.style.overflowY = hasScrollbar ? 'scroll' : 'hidden'

      return () => {
        // Restore body styles and scroll position
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflowY = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isCursorOnChat])

  useEffect(() => {
    if (latestThreadRef.current) {
      latestThreadRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [threads.length])

  return (
    <div
      className={`fixed z-50 overflow-x-hidden transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${isClosing || !entered ? 'translate-y-full' : 'translate-y-0'} ${isMaximized ? 'top-0 left-0 right-0 bottom-0 w-full h-full' : isDesktop ? 'md:fixed md:top-[15vh] md:right-8 md:left-auto md:h-[80vh] md:max-h-[80vh] md:w-[50vw] md:shadow-[0_2px_16px_rgba(0,0,0,0.15)] md:z-50 md:rounded-xl md:overflow-x-hidden' : 'top-0 left-0 right-0 bottom-0 w-full h-full'}`}
      onMouseEnter={() => setIsCursorOnChat(true)}
      onMouseLeave={() => setIsCursorOnChat(false)}
    >
      <div
        className={`bg-[var(--background)] text-[var(--foreground)] rounded-none shadow-lg flex flex-col h-full w-full overflow-hidden overflow-x-hidden ${isDesktop ? 'md:h-full md:w-full md:flex md:flex-col md:rounded-xl md:overflow-x-hidden' : ''}`}
      >
        {headerContent || (
          <ChatHeader onClose={onClose} onMaximize={handleMaximize} isMaximized={isMaximized} />
        )}

        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden px-4 ${headerContent ? 'pt-3' : 'mt-4'} modal-content`}
        >
          <div className="w-full max-w-4xl mx-auto">
            {children}
            {threads.map((thread: Thread, index: number) => (
              <div key={thread.id} ref={index === threads.length - 1 ? latestThreadRef : undefined}>
                <ThreadView
                  thread={thread}
                  onFAQClick={handleFAQClick}
                  isLastThread={index === threads.length - 1}
                  isThinking={isThinking}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pb-6 md:pb-0">
          <ChatInput
            input={input}
            setInput={setInput}
            handleSubmit={async () => {
              if (input.trim()) {
                const threadId = addThread(input)
                await handleSubmit(input, threadId)
                setInput('')
              }
            }}
            isLoading={isLoading}
            onCancel={cancelRequest}
            deepAnalysis={deepAnalysis}
            setDeepAnalysis={setDeepAnalysis}
            preferredModel={preferredModel}
            setPreferredModel={setPreferredModel}
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  )
}

/** Header for Smart Brief mode — shows title, subtitle, close/maximize */
function BriefHeader({
  primaryLabel,
  onClose,
  showBackToBrief,
  onBackToBrief,
}: {
  primaryLabel: string
  onClose: () => void
  showBackToBrief: boolean
  onBackToBrief: () => void
}) {
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date())

  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] text-[var(--accent-active)] dark:text-[var(--accent-active-dark)] shrink-0">
          <Sun size={13} strokeWidth={2.4} />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate">
            Your morning brief
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5 truncate">
            {today} · Focused on {primaryLabel}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {showBackToBrief && (
          <button
            onClick={onBackToBrief}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft size={10} />
            Brief
          </button>
        )}
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          aria-label="Close"
        >
          <Minus size={14} />
        </button>
      </div>
    </div>
  )
}

const FinancialChatbox: React.FC<FinancialChatboxProps> = ({
  onClose,
  children,
  isDesktop,
  isClosing,
}) => {
  const params = useParams()
  const ticker = params.ticker as string | undefined
  const context = useContext(ChatContext)
  if (!context) throw new Error('ChatContext must be used within a ChatProvider')

  const {
    threads,
    input,
    setInput,
    addThread,
    updateThread,
    clearThreads,
    handleSubmit,
    isLoading,
    isThinking,
    cancelRequest,
    deepAnalysis,
    setDeepAnalysis,
    preferredModel,
    setPreferredModel,
    conversationId,
    setConversationId,
    recordActivity,
  } = context

  // Smart Brief: only on Home route (no ticker)
  const isHomeRoute = !ticker
  const { favourites } = useFavourites<Company>('stonkie_favourites')
  const briefMarkets = useBriefMarkets(favourites)
  const briefData = useBriefData(briefMarkets)

  const [activeRecapId, _setActiveRecapId] = useState<string | null>(null)
  const activeRecapIdRef = useRef<string | null>(null)
  const setActiveRecapId = (id: string | null) => {
    activeRecapIdRef.current = id
    _setActiveRecapId(id)
  }
  const [activeRecapMarket, setActiveRecapMarket] = useState<string | null>(null)

  // Show brief when no user-initiated threads exist (ignore auto-seeded FAQ/recap-question threads)
  const hasUserThreads = threads.some((t) => isNormalThread(t))
  const showBrief = isHomeRoute && !hasUserThreads && activeRecapId === null

  // Wire recap chat API for when user digs into a specific market
  const {
    handleSubmit: handleRecapSubmit,
    isLoading: recapLoading,
    isThinking: recapThinking,
    cancelRequest: cancelRecap,
  } = useRecapChatAPI(
    activeRecapIdRef,
    updateThread,
    conversationId,
    setConversationId,
    recordActivity,
  )

  const handleDigIntoRecap = (recapId: string, marketKey: string) => {
    setActiveRecapId(recapId)
    setActiveRecapMarket(marketKey)
  }

  const handleBackToBrief = () => {
    clearThreads()
    setActiveRecapId(null)
    setActiveRecapMarket(null)
  }

  const handleFAQClick = async (question: string) => {
    const threadId = addThread(question)
    if (activeRecapId) {
      await handleRecapSubmit(question, threadId, false, deepAnalysis, preferredModel)
    } else {
      await handleSubmit(question, threadId, false, deepAnalysis, preferredModel)
    }
  }

  const handleAskQuestion = async (question: string) => {
    const threadId = addThread(question)
    if (activeRecapIdRef.current) {
      await handleRecapSubmit(question, threadId, false, deepAnalysis, preferredModel)
    } else {
      await handleSubmit(question, threadId, false, deepAnalysis, preferredModel)
    }
  }

  // Build brief header
  const briefHeader = isHomeRoute ? (
    <BriefHeader
      primaryLabel={briefMarkets.primary.label}
      onClose={onClose}
      showBackToBrief={!showBrief && activeRecapId !== null}
      onBackToBrief={handleBackToBrief}
    />
  ) : undefined

  // Build brief content — either the panel or the recap detail view
  const activeMarketData = activeRecapId
    ? briefData.markets.find((m) => m.market.key === activeRecapMarket)
    : null

  let briefContent: React.ReactNode | undefined
  if (showBrief) {
    briefContent = (
      <SmartBriefPanel
        briefData={briefData}
        favourites={favourites}
        briefMarkets={briefMarkets}
        onDigIntoRecap={handleDigIntoRecap}
        onAskQuestion={handleAskQuestion}
        onClose={onClose}
      />
    )
  } else if (activeMarketData?.recap && threads.length === 0) {
    briefContent = (
      <RecapDetailView
        market={activeMarketData}
        onAskQuestion={handleAskQuestion}
        onBackToBrief={handleBackToBrief}
      />
    )
  }

  const effectiveLoading = activeRecapId ? recapLoading : isLoading
  const effectiveThinking = activeRecapId ? recapThinking : isThinking
  const effectiveCancel = activeRecapId ? cancelRecap : cancelRequest

  // When showing brief or recap detail, hide threads
  const visibleThreads = briefContent ? [] : threads

  return (
    <ChatboxUI
      threads={visibleThreads}
      input={input}
      setInput={setInput}
      addThread={addThread}
      handleSubmit={(question: string, threadId: string) => {
        if (activeRecapId) {
          return handleRecapSubmit(question, threadId, false, deepAnalysis, preferredModel)
        }
        return handleSubmit(question, threadId, false, deepAnalysis, preferredModel)
      }}
      isLoading={effectiveLoading}
      isThinking={effectiveThinking}
      cancelRequest={effectiveCancel}
      onClose={onClose}
      isDesktop={isDesktop}
      handleFAQClick={handleFAQClick}
      deepAnalysis={deepAnalysis}
      setDeepAnalysis={setDeepAnalysis}
      preferredModel={preferredModel}
      setPreferredModel={setPreferredModel}
      placeholder={showBrief ? 'Or ask your own question...' : 'Ask follow-up...'}
      headerContent={briefHeader}
      isClosing={isClosing}
    >
      {briefContent || children}
    </ChatboxUI>
  )
}

export default FinancialChatbox

export const InsightChatbox: React.FC<FinancialChatboxProps> = ({
  onClose,
  children,
  isDesktop,
}) => {
  const params = useParams()
  const ticker = params.ticker as string | undefined

  const {
    threads,
    input,
    setInput,
    addThread,
    updateThread,
    deepAnalysis,
    setDeepAnalysis,
    preferredModel,
    setPreferredModel,
    conversationId,
    setConversationId,
    recordActivity,
  } = useChatState(ticker)

  const { handleSubmit, isLoading, isThinking, cancelRequest } = useChatAPI(
    ticker,
    updateThread,
    conversationId,
    setConversationId,
    recordActivity,
  )
  const { data: faqQuestions } = useFAQQuery(ticker)
  const faqProcessedRef = useRef<string | null>(null)

  // Create FAQ thread when FAQs are loaded
  useEffect(() => {
    if (faqQuestions && faqQuestions.length > 0) {
      const threadId = `faq-${ticker || 'general'}`

      // Only process if we haven't already processed FAQs for this ticker
      if (faqProcessedRef.current !== threadId) {
        // Check if FAQ thread already exists
        const existingFAQThread = threads.find(
          (thread) => thread.question === 'Frequently Asked Questions',
        )

        if (!existingFAQThread) {
          updateThread(threadId, {
            id: threadId,
            question: 'Frequently Asked Questions',
            relatedQuestions: faqQuestions,
          })
          faqProcessedRef.current = threadId
        } else if (existingFAQThread.relatedQuestions.length !== faqQuestions.length) {
          // Update if FAQs have changed
          updateThread(existingFAQThread.id, {
            relatedQuestions: faqQuestions,
          })
          faqProcessedRef.current = threadId
        }
      }
    }
  }, [faqQuestions, ticker, updateThread, threads])

  // Reset ref when ticker changes
  useEffect(() => {
    faqProcessedRef.current = null
  }, [ticker])

  const handleFAQClick = async (question: string) => {
    const threadId = addThread(question)
    await handleSubmit(question, threadId, false, deepAnalysis, preferredModel)
  }

  return (
    <ChatboxUI
      threads={threads}
      input={input}
      setInput={setInput}
      addThread={addThread}
      handleSubmit={(question: string, threadId: string) =>
        handleSubmit(question, threadId, false, deepAnalysis, preferredModel)
      }
      isLoading={isLoading}
      isThinking={isThinking}
      cancelRequest={cancelRequest}
      children={children}
      onClose={onClose}
      isDesktop={isDesktop}
      handleFAQClick={handleFAQClick}
      deepAnalysis={deepAnalysis}
      setDeepAnalysis={setDeepAnalysis}
      preferredModel={preferredModel}
      setPreferredModel={setPreferredModel}
    />
  )
}
