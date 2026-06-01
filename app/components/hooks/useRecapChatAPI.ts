import { useRef, useState } from 'react'
import {
  AnalysisPhase,
  AnswerGround,
  AnswerSource,
  Thread,
  ThoughtStep,
  VisualBlock,
} from './useChatState'
import { chatService } from '../services/chatService'

type VisualLang = 'html' | 'svg'

type StreamChunk = {
  type: string
  body?: unknown
  url?: string
  title?: string
  phase?: AnalysisPhase
  step?: number
  total_steps?: number
}

type V2SourceChunk = {
  source_id?: string
  url?: string
  title?: string
  publisher?: string
  published_at?: string | null
  is_trusted?: boolean
}

const visualMarker = (blockId: string) => `\n\n[[VISUAL_BLOCK:${blockId}]]\n\n`

export const useRecapChatAPI = (
  recapIdOrRef: string | React.RefObject<string | null>,
  updateThread: (threadId: string, updates: Partial<Thread>) => void,
  conversationId: string | null = null,
  setConversationId: (id: string | null) => void = () => {},
  recordActivity: () => void = () => {},
) => {
  const [isLoading, setIsLoading] = useState(false)
  const isThinkingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const getRecapId = () =>
    typeof recapIdOrRef === 'string' ? recapIdOrRef : (recapIdOrRef.current ?? '')

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
    _useUrlContext: boolean = false,
    deepAnalysis: boolean = false,
    preferredModel: string = 'fastest',
  ) => {
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    setIsLoading(true)
    isThinkingRef.current = true
    recordActivity()
    try {
      const reader = await chatService.analyzeRecapQuestion(
        getRecapId(),
        question,
        conversationId,
        deepAnalysis,
        preferredModel,
        signal,
      )
      if (!reader) throw new Error('Failed to get reader')

      const decoder = new TextDecoder()
      let accumulatedContent = ''
      let thoughts: ThoughtStep[] = []
      let relatedQuestions: string[] = []
      let grounds: AnswerGround[] = []
      let visualBlocks: VisualBlock[] = []
      let buffer = ''

      const upsertVisualBlock = (
        blockId: string,
        updates: Partial<VisualBlock> & Pick<VisualBlock, 'blockId'>,
      ) => {
        const existingIndex = visualBlocks.findIndex((b) => b.blockId === blockId)
        if (existingIndex === -1) {
          const next: VisualBlock = {
            blockId,
            lang: (updates.lang as VisualLang) || 'html',
            content: updates.content || '',
            status: updates.status || 'streaming',
            errorMessage: updates.errorMessage,
          }
          visualBlocks = [...visualBlocks, next]
          return
        }

        const existing = visualBlocks[existingIndex]
        const merged: VisualBlock = {
          ...existing,
          ...updates,
          blockId,
          lang: (updates.lang as VisualLang) || existing.lang,
        }
        visualBlocks = [
          ...visualBlocks.slice(0, existingIndex),
          merged,
          ...visualBlocks.slice(existingIndex + 1),
        ]
      }

      const handleParsedChunk = (parsedChunk: StreamChunk) => {
        if (parsedChunk.type === 'conversation') {
          const body = (parsedChunk.body || {}) as { conversationId?: string }
          const newConversationId = body.conversationId || null
          if (newConversationId) {
            setConversationId(newConversationId)
            recordActivity()
          }
          return
        }

        if (parsedChunk.type === 'answer') {
          if (isThinkingRef.current) {
            isThinkingRef.current = false
          }
          accumulatedContent += String(parsedChunk.body || '')
          updateThread(threadId, { answer: accumulatedContent })
          return
        }

        if (parsedChunk.type === 'answer_visual_start') {
          if (isThinkingRef.current) {
            isThinkingRef.current = false
          }

          const body = (parsedChunk.body || {}) as { block_id?: string; lang?: string }
          if (!body.block_id || !body.lang) return
          if (!(['svg', 'html'] as string[]).includes(body.lang)) return

          upsertVisualBlock(body.block_id, {
            blockId: body.block_id,
            lang: body.lang as VisualLang,
            status: 'streaming',
            content: '',
          })

          const markerToken = `[[VISUAL_BLOCK:${body.block_id}]]`
          if (!accumulatedContent.includes(markerToken)) {
            accumulatedContent += visualMarker(body.block_id)
          }

          updateThread(threadId, {
            answer: accumulatedContent,
            visualBlocks,
          })
          return
        }

        if (parsedChunk.type === 'answer_visual_delta') {
          const body = (parsedChunk.body || {}) as { block_id?: string; delta?: string }
          if (!body.block_id) return

          const existing = visualBlocks.find((b) => b.blockId === body.block_id)
          upsertVisualBlock(body.block_id, {
            blockId: body.block_id,
            status: existing?.status || 'streaming',
            content: `${existing?.content || ''}${body.delta || ''}`,
            lang: existing?.lang || 'html',
          })

          updateThread(threadId, { visualBlocks })
          return
        }

        if (parsedChunk.type === 'answer_visual_done') {
          const body = (parsedChunk.body || {}) as {
            block_id?: string
            lang?: string
            content?: string
          }
          if (!body.block_id || !body.lang) return
          if (!(['svg', 'html'] as string[]).includes(body.lang)) return

          upsertVisualBlock(body.block_id, {
            blockId: body.block_id,
            lang: body.lang as VisualLang,
            content: body.content || '',
            status: 'done',
          })

          updateThread(threadId, { visualBlocks })
          return
        }

        if (parsedChunk.type === 'answer_visual_error') {
          const body = (parsedChunk.body || {}) as { block_id?: string; message?: string }
          if (!body.block_id) return

          const existing = visualBlocks.find((b) => b.blockId === body.block_id)
          upsertVisualBlock(body.block_id, {
            blockId: body.block_id,
            status: 'error',
            errorMessage: body.message || 'Failed to render visual block.',
            lang: existing?.lang || 'html',
            content: existing?.content || '',
          })

          updateThread(threadId, { visualBlocks })
          return
        }

        if (parsedChunk.type === 'thinking_status') {
          if (!parsedChunk.phase || parsedChunk.step == null) return
          if (!isThinkingRef.current) {
            isThinkingRef.current = true
          }
          const thoughtStep: ThoughtStep = {
            body: String(parsedChunk.body || ''),
            phase: parsedChunk.phase,
            step: parsedChunk.step,
            totalSteps: parsedChunk.total_steps,
          }
          thoughts = [...thoughts, thoughtStep]
          updateThread(threadId, { thoughts })
          return
        }

        if (parsedChunk.type === 'related_question') {
          relatedQuestions = [...relatedQuestions, String(parsedChunk.body || '')]
          updateThread(threadId, { relatedQuestions })
          return
        }

        if (parsedChunk.type === 'google_search_ground') {
          grounds = [
            ...grounds,
            { body: String(parsedChunk.body || ''), url: String(parsedChunk.url || '') },
          ]
          updateThread(threadId, { grounds })
          return
        }

        if (parsedChunk.type === 'sources') {
          if (Array.isArray(parsedChunk.body)) {
            const sources: AnswerSource[] = parsedChunk.body.map((source) => {
              const item = source as V2SourceChunk
              return {
                sourceId: item.source_id,
                url: item.url,
                title: item.title,
                publisher: item.publisher,
                publishedAt: item.published_at,
                isTrusted: item.is_trusted,
              }
            })
            updateThread(threadId, { sources })
          }
          return
        }

        if (parsedChunk.type === 'sources_grouped') {
          const body = (parsedChunk.body || {}) as {
            sources?: { name: string; url?: string; paragraph_indices?: number[] }[]
          }
          const groupedSources: AnswerSource[] = (body.sources || []).map((s) => ({
            title: s.name,
            url: s.url,
            paragraphIndices: s.paragraph_indices,
          }))
          updateThread(threadId, { sources: groupedSources })
          return
        }

        if (parsedChunk.type === 'model_used') {
          updateThread(threadId, { modelName: String(parsedChunk.body || '') })
          return
        }

        if (parsedChunk.type === 'attachment_url') {
          updateThread(threadId, {
            attachment: {
              title: String(parsedChunk.title || 'Attachment'),
              url: String(parsedChunk.body || ''),
            },
          })
          return
        }

        if (parsedChunk.type === 'error') {
          isThinkingRef.current = false
          updateThread(threadId, {
            answer: String(parsedChunk.body || 'An error occurred.'),
            thoughts: [],
          })
          setIsLoading(false)
          return
        }
      }

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const parsedChunk = JSON.parse(trimmed) as StreamChunk
            handleParsedChunk(parsedChunk)
          } catch (e) {
            console.error('Error parsing chunk:', e)
          }
        }
      }

      if (buffer.trim()) {
        try {
          const parsedChunk = JSON.parse(buffer.trim()) as StreamChunk
          handleParsedChunk(parsedChunk)
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
          visualBlocks: [],
        })
        return
      }

      console.error('Error in chat:', error)
      updateThread(threadId, {
        answer: 'Sorry, I encountered an error analyzing the data.',
        thoughts: [],
        relatedQuestions: [],
        visualBlocks: [],
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
