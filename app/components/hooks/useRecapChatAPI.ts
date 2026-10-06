import type { RefObject } from 'react'
import type { Thread } from './useChatState'
import { useStreamingChatAPI } from './useStreamingChatAPI'
import { chatService } from '../services/chatService'

export const useRecapChatAPI = (
  recapIdOrRef: string | RefObject<string | null>,
  updateThread: (threadId: string, updates: Partial<Thread>) => void,
  conversationId: string | null = null,
  setConversationId: (id: string | null) => void = () => {},
  recordActivity: () => void = () => {},
) =>
  useStreamingChatAPI(
    ({ question, conversationId, deepAnalysis, preferredModel, signal }) =>
      chatService.analyzeRecapQuestion(
        typeof recapIdOrRef === 'string' ? recapIdOrRef : (recapIdOrRef.current ?? ''),
        question,
        conversationId,
        deepAnalysis,
        preferredModel,
        signal,
      ),
    updateThread,
    conversationId,
    setConversationId,
    recordActivity,
  )
