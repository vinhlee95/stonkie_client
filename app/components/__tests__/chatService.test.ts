import { afterEach, describe, expect, it, vi } from 'vitest'
import { chatService } from '../services/chatService'

describe('chatService.analyzeQuestion', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('posts analyze requests to the v2 company endpoint', async () => {
    const reader = { read: vi.fn() }
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      body: {
        getReader: () => reader,
      },
    } as unknown as Response)

    const result = await chatService.analyzeQuestion(
      'What changed?',
      'AAPL',
      true,
      true,
      'fastest',
      'conversation-123',
    )

    expect(result).toBe(reader)
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:8080/api/v2/companies/AAPL/analyze',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const [, init] = fetchSpy.mock.calls[0]!
    expect(JSON.parse(String(init?.body))).toEqual({
      question: 'What changed?',
      conversationId: 'conversation-123',
      useUrlContext: true,
      deepAnalysis: true,
      preferredModel: 'fastest',
    })
  })
})
