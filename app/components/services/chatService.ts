const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

/** A chat request the server answered with a non-2xx status. */
export class ChatRequestError extends Error {
  /** `detail` is the server's user-facing reason, when it sent one (e.g. rate limited). */
  constructor(
    readonly status: number,
    readonly detail?: string,
  ) {
    super(`Chat request failed with status ${status}`)
    this.name = 'ChatRequestError'
  }
}

async function errorDetail(response: Response): Promise<string | undefined> {
  const body = await response.json().catch(() => null)
  const detail = body?.detail ?? body?.error
  return typeof detail === 'string' ? detail : undefined
}

export const chatService = {
  async analyzeQuestion(
    question: string,
    ticker: string | undefined,
    useUrlContext: boolean = false,
    deepAnalysis: boolean = false,
    preferredModel: string = 'fastest',
    conversationId: string | null = null,
    signal?: AbortSignal,
  ) {
    const response = await fetch(`${BACKEND_URL}/api/v2/companies/${ticker}/analyze`, {
      method: 'POST',
      credentials: 'include', // Required for cross-origin cookie support
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        conversationId, // Include conversationId for conversation memory
        useUrlContext,
        deepAnalysis,
        preferredModel,
      }),
      signal,
    })

    if (!response.ok) {
      throw new Error('Failed to get analysis')
    }

    return response.body?.getReader()
  },

  async fetchFAQs(ticker: string | undefined) {
    const URL = ticker
      ? `${BACKEND_URL}/api/company/faq?ticker=${ticker}&stream=true`
      : `${BACKEND_URL}/api/company/faq?stream=true`

    const response = await fetch(URL)
    return response.body?.getReader()
  },

  async analyzeRecapQuestion(
    recapId: string,
    question: string,
    conversationId: string | null = null,
    deepAnalysis: boolean = false,
    preferredModel: string = 'fastest',
    signal?: AbortSignal,
  ) {
    const response = await fetch(
      `${BACKEND_URL}/api/recaps/${encodeURIComponent(recapId)}/analyze`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          conversationId,
          deepAnalysis,
          preferredModel,
        }),
        signal,
      },
    )

    if (!response.ok) {
      throw new Error('Failed to get analysis')
    }

    return response.body?.getReader()
  },

  /** Signed-in portfolio chat, via the same-origin BFF route (which attaches the backend JWT). */
  async analyzePortfolioQuestion(
    question: string,
    scopeTicker: string | null,
    conversationId: string | null = null,
    preferredModel: string = 'fastest',
    signal?: AbortSignal,
  ) {
    const response = await fetch('/api/me/portfolio/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, scopeTicker, conversationId, preferredModel }),
      signal,
    })
    if (!response.ok) throw new ChatRequestError(response.status, await errorDetail(response))
    return response.body?.getReader()
  },

  async fetchDetailedReport(ticker: string | undefined, slug: string) {
    const response = await fetch(`${BACKEND_URL}/api/companies/${ticker}/reports/${slug}`)
    return response.body?.getReader()
  },
}
