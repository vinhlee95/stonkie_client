import type { Thread } from './useChatState'
import { useStreamingChatAPI } from './useStreamingChatAPI'
import { chatService } from '../services/chatService'

/** Portfolio chat stream; `scopeTicker` focuses the answer on one holding. */
export const usePortfolioChatAPI = (
  scopeTicker: string | null,
  updateThread: (threadId: string, updates: Partial<Thread>) => void,
  conversationId: string | null,
  setConversationId: (id: string | null) => void,
  recordActivity: () => void,
) =>
  useStreamingChatAPI(
    ({ question, conversationId, preferredModel, signal }) =>
      chatService.analyzePortfolioQuestion(
        question,
        scopeTicker,
        conversationId,
        preferredModel,
        signal,
      ),
    updateThread,
    conversationId,
    setConversationId,
    recordActivity,
  )
