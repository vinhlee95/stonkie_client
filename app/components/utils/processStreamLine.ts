/**
 * Processes a single parsed SSE line from the backend streaming response.
 * Returns updates to apply to the accumulated state.
 */

import { AnalysisPhase, ThoughtStep } from '../hooks/useChatState'

export interface StreamState {
  accumulatedContent: string
  thoughts: ThoughtStep[]
  relatedQuestions: string[]
  conversationId: string | null
  modelName: string | undefined
  attachment: { title: string; url: string } | undefined
}

export function processStreamLine(
  parsed: {
    type: string
    body?: unknown
    url?: string
    title?: string
    phase?: AnalysisPhase
    step?: number
    total_steps?: number
  },
  state: StreamState,
): StreamState {
  const next = { ...state }

  switch (parsed.type) {
    case 'conversation': {
      const body = parsed.body as { conversationId?: string } | undefined
      next.conversationId = body?.conversationId || null
      break
    }
    case 'answer':
      next.accumulatedContent += parsed.body as string
      break
    case 'thinking_status': {
      if (!parsed.phase || parsed.step == null) break
      const thoughtStep: ThoughtStep = {
        body: String(parsed.body || ''),
        phase: parsed.phase,
        step: parsed.step,
        totalSteps: parsed.total_steps,
      }
      next.thoughts = [...state.thoughts, thoughtStep]
      break
    }
    case 'related_question':
      next.relatedQuestions = [...state.relatedQuestions, parsed.body as string]
      break
    case 'sources':
      break
    case 'model_used':
      next.modelName = parsed.body as string
      break
    case 'attachment_url':
      next.attachment = {
        title: (parsed.title as string) || 'Attachment',
        url: parsed.body as string,
      }
      break
  }

  return next
}
