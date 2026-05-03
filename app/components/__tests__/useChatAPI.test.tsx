import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useChatAPI } from '../hooks/useChatAPI'
import { chatService } from '../services/chatService'

vi.mock('../services/chatService', () => ({
  chatService: {
    analyzeQuestion: vi.fn(),
  },
}))

function createReader(chunks: string[]) {
  let index = 0
  const encoder = new TextEncoder()

  return {
    read: vi.fn(async () => {
      if (index >= chunks.length) {
        return { value: undefined, done: true }
      }

      const value = encoder.encode(chunks[index]!)
      index += 1
      return { value, done: false }
    }),
  }
}

describe('useChatAPI', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('stores structured sources without mutating answer text', async () => {
    const reader = createReader([
      '{"type":"answer","body":"Plain answer"}\n',
      '{"type":"sources","body":[{"source_id":"s1","url":"https://www.reuters.com/story","title":"","publisher":"Reuters","published_at":"2026-05-01T12:00:00Z","is_trusted":true}]}\n',
      '{"type":"model_used","body":"google/gemini-2.5-flash:nitro"}\n',
    ])

    vi.mocked(chatService.analyzeQuestion).mockResolvedValue(reader as never)

    const updateThread = vi.fn()
    const { result } = renderHook(() =>
      useChatAPI('AAPL', updateThread, 'conversation-1', vi.fn(), vi.fn()),
    )

    await act(async () => {
      await result.current.handleSubmit('What changed?', 'thread-1')
    })

    expect(chatService.analyzeQuestion).toHaveBeenCalledWith(
      'What changed?',
      'AAPL',
      false,
      false,
      'fastest',
      'conversation-1',
      expect.any(AbortSignal),
    )

    expect(updateThread).toHaveBeenCalledWith('thread-1', { answer: 'Plain answer' })
    expect(updateThread).toHaveBeenCalledWith('thread-1', {
      sources: [
        {
          sourceId: 's1',
          url: 'https://www.reuters.com/story',
          title: '',
          publisher: 'Reuters',
          publishedAt: '2026-05-01T12:00:00Z',
          isTrusted: true,
        },
      ],
    })

    const answerUpdates = updateThread.mock.calls.filter(
      ([, update]) => typeof update.answer === 'string',
    )
    expect(answerUpdates).toHaveLength(1)
    expect(answerUpdates[0]?.[1]).toEqual({ answer: 'Plain answer' })
  })

  it('leaves sources empty when the stream never emits a sources event', async () => {
    const reader = createReader([
      '{"type":"answer","body":"No citations here"}\n',
      '{"type":"related_question","body":"What else?"}\n',
    ])

    vi.mocked(chatService.analyzeQuestion).mockResolvedValue(reader as never)

    const updateThread = vi.fn()
    const { result } = renderHook(() => useChatAPI('AAPL', updateThread))

    await act(async () => {
      await result.current.handleSubmit('Blank-ish', 'thread-2')
    })

    expect(updateThread).not.toHaveBeenCalledWith(
      'thread-2',
      expect.objectContaining({ sources: expect.anything() }),
    )
    expect(updateThread).toHaveBeenCalledWith('thread-2', { answer: 'No citations here' })
  })
})
