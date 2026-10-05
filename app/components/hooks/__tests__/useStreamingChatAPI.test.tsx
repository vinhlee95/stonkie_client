import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatRequestError, chatService } from '../../services/chatService'
import { useRecapChatAPI } from '../useRecapChatAPI'
import {
  SESSION_EXPIRED_ANSWER,
  useStreamingChatAPI,
  type OpenChatStream,
} from '../useStreamingChatAPI'

function reader(chunks: string[]) {
  const encoder = new TextEncoder()
  let i = 0
  return {
    read: vi.fn(async () =>
      i < chunks.length
        ? { value: encoder.encode(chunks[i++]), done: false }
        : { value: undefined, done: true },
    ),
  } as unknown as ReadableStreamDefaultReader<Uint8Array>
}

const line = (event: object) => JSON.stringify(event) + '\n\n'

function setup(openStream: OpenChatStream) {
  const updateThread = vi.fn()
  const setConversationId = vi.fn()
  const hook = renderHook(() =>
    useStreamingChatAPI(openStream, updateThread, 'conv-0', setConversationId),
  )
  const submit = () =>
    act(async () => {
      await hook.result.current.handleSubmit('Q?', 'thread-1', false, false, 'fastest')
    })
  const last = () => updateThread.mock.calls.at(-1)![1]
  return { hook, updateThread, setConversationId, submit, last }
}

describe('useStreamingChatAPI', () => {
  it('folds conversation, thinking, answer, sources and model events into the thread', async () => {
    const openStream = vi.fn(async () =>
      reader([
        line({ type: 'conversation', body: { conversationId: 'conv-1' } }),
        line({ type: 'thinking_status', body: 'Reading…', phase: 'analyze', step: 1 }),
        line({ type: 'answer', body: 'Hello ' }),
        // One JSON line split across two reads.
        '{"type":"answer","bo',
        'dy":"world"}\n\n',
        line({
          type: 'sources',
          body: [{ source_id: 's1', url: 'https://r.com', publisher: 'Reuters' }],
        }),
        line({ type: 'model_used', body: 'm1' }),
      ]),
    )
    const { updateThread, setConversationId, submit, hook } = setup(openStream)

    await submit()

    expect(openStream).toHaveBeenCalledWith(
      expect.objectContaining({
        question: 'Q?',
        conversationId: 'conv-0',
        preferredModel: 'fastest',
      }),
    )
    expect(setConversationId).toHaveBeenCalledWith('conv-1')
    const updates = updateThread.mock.calls.map(([, u]) => u)
    expect(updates).toContainEqual({
      thoughts: [{ body: 'Reading…', phase: 'analyze', step: 1, totalSteps: undefined }],
    })
    expect(updates).toContainEqual({ answer: 'Hello world' })
    expect(updates).toContainEqual({
      sources: [
        expect.objectContaining({ sourceId: 's1', url: 'https://r.com', publisher: 'Reuters' }),
      ],
    })
    expect(updates).toContainEqual({ modelName: 'm1' })
    expect(hook.result.current.isLoading).toBe(false)
  })

  it('builds visual blocks from start/delta/done events', async () => {
    const { updateThread, submit } = setup(async () =>
      reader([
        line({ type: 'answer_visual_start', body: { block_id: 'b1', lang: 'svg' } }),
        line({ type: 'answer_visual_delta', body: { block_id: 'b1', delta: '<svg>' } }),
        line({
          type: 'answer_visual_done',
          body: { block_id: 'b1', lang: 'svg', content: '<svg></svg>' },
        }),
      ]),
    )

    await submit()

    const visual = updateThread.mock.calls
      .map(([, u]) => u.visualBlocks)
      .filter(Boolean)
      .at(-1)
    expect(visual).toEqual([
      {
        blockId: 'b1',
        lang: 'svg',
        content: '<svg></svg>',
        status: 'done',
        errorMessage: undefined,
      },
    ])
  })

  it('shows a server error event as the answer and stops thinking', async () => {
    const { submit, hook, last } = setup(async () =>
      reader([
        line({ type: 'thinking_status', body: 'Reading…', phase: 'analyze', step: 1 }),
        line({ type: 'error', code: 'busy', body: 'Portfolio chat is busy' }),
      ]),
    )

    await submit()

    expect(last()).toEqual({ answer: 'Portfolio chat is busy', thoughts: [] })
    expect(hook.result.current.isThinking).toBe(false)
  })

  it.each([
    [new ChatRequestError(401), SESSION_EXPIRED_ANSWER],
    [
      new ChatRequestError(429, 'Too many portfolio chat requests, try again in a minute'),
      'Too many portfolio chat requests, try again in a minute',
    ],
    [new ChatRequestError(422, 'TSLA is not in your portfolio'), 'TSLA is not in your portfolio'],
    [
      new ChatRequestError(502, 'Backend unavailable'),
      'Sorry, I encountered an error analyzing the data.',
    ],
    [new Error('network'), 'Sorry, I encountered an error analyzing the data.'],
  ])('maps a failed request to a user-facing answer (%s)', async (error, answer) => {
    const { submit, hook, last } = setup(async () => {
      throw error
    })

    await submit()

    expect(last()).toMatchObject({ answer, thoughts: [] })
    expect(hook.result.current.isThinking).toBe(false)
    expect(hook.result.current.isLoading).toBe(false)
  })

  it('cancelling aborts the request and marks the thread cancelled', async () => {
    let signal: AbortSignal | undefined
    const { hook, last } = setup(async (request) => {
      signal = request.signal
      return new Promise((_, reject) =>
        request.signal.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')),
        ),
      )
    })

    let pending: Promise<void> | undefined
    act(() => {
      pending = hook.result.current.handleSubmit('Q?', 'thread-1')
    })
    act(() => hook.result.current.cancelRequest())
    await act(async () => {
      await pending
    })

    expect(signal?.aborted).toBe(true)
    expect(last()).toMatchObject({ answer: 'Request cancelled.' })
  })

  it('unmounting aborts an in-flight request', async () => {
    let signal: AbortSignal | undefined
    const { hook } = setup(async (request) => {
      signal = request.signal
      return new Promise(() => {})
    })

    act(() => {
      void hook.result.current.handleSubmit('Q?', 'thread-1')
    })
    hook.unmount()

    expect(signal?.aborted).toBe(true)
  })
})

describe('useRecapChatAPI', () => {
  it('opens the recap stream with the recap id and request fields', async () => {
    const analyze = vi
      .spyOn(chatService, 'analyzeRecapQuestion')
      .mockResolvedValue(reader([]) as never)
    const { result } = renderHook(() => useRecapChatAPI('91', vi.fn(), 'conv-1'))

    await act(async () => {
      await result.current.handleSubmit('Why?', 't1', false, true, 'smart')
    })

    expect(analyze).toHaveBeenCalledWith(
      '91',
      'Why?',
      'conv-1',
      true,
      'smart',
      expect.any(AbortSignal),
    )
  })
})
