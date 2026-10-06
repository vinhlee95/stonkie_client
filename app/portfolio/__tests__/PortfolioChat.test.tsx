import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { createTestQueryClient, render, screen, waitFor } from '@/tests/test-utils'
import { PORTFOLIO_QUERY_KEY } from '@/lib/api/portfolio'
import { chatService } from '@/app/components/services/chatService'
import { SESSION_EXPIRED_ANSWER } from '@/app/components/hooks/useStreamingChatAPI'
import PortfolioChat from '../components/PortfolioChat'
import { PORTFOLIO } from './chatFixtures'

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
})

function streamOf(...events: object[]) {
  const text = events.map((e) => JSON.stringify(e) + '\n\n').join('')
  return new Response(text).body!.getReader()
}

const analyze = vi.spyOn(chatService, 'analyzePortfolioQuestion')

function renderChat() {
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(PORTFOLIO_QUERY_KEY, PORTFOLIO)
  return render(<PortfolioChat onClose={vi.fn()} isDesktop={false} />, { queryClient })
}

beforeEach(() => {
  analyze.mockReset()
  localStorage.clear()
})

describe('PortfolioChat', () => {
  it('shows the portfolio context, holding chips and starter questions', () => {
    renderChat()

    expect(screen.getByText('Portfolio chat')).toBeInTheDocument()
    expect(screen.getByText('€10,000')).toBeInTheDocument()
    expect(
      screen.getByText(/3 holdings, weights, cost basis, performance and risk/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^TSLA/ })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Why is TSLA down 7.5%?')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ask about your portfolio…')).toBeInTheDocument()
  })

  it('focuses on a holding and back', async () => {
    renderChat()

    await userEvent.click(screen.getByRole('button', { name: /^TSLA/ }))

    expect(screen.getByText(/Your portfolio › TSLA/)).toBeInTheDocument()
    expect(screen.getByText('How much does TSLA add to my risk?')).toBeInTheDocument()
    expect(screen.queryByText("Explain today's move")).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ask about TSLA in your portfolio…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stop focusing on TSLA' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Whole portfolio' }))

    expect(screen.queryByText(/Your portfolio › TSLA/)).not.toBeInTheDocument()
    expect(screen.getByText("Explain today's move")).toBeInTheDocument()
  })

  it('asks a starter question with the focused holding and offers related questions', async () => {
    analyze.mockResolvedValue(
      streamOf(
        { type: 'conversation', body: { conversationId: 'conv-1' } },
        { type: 'answer', body: 'TSLA fell after deliveries.' },
      ),
    )
    renderChat()

    await userEvent.click(screen.getByRole('button', { name: /^TSLA/ }))
    await userEvent.click(screen.getByText('Why is TSLA down 7.5% today?'))

    await waitFor(() => expect(screen.getByText('TSLA fell after deliveries.')).toBeInTheDocument())
    expect(analyze).toHaveBeenCalledWith(
      'Why is TSLA down 7.5% today?',
      'TSLA',
      null,
      expect.any(String),
      expect.any(AbortSignal),
    )
    expect(screen.queryByRole('button', { name: /^AAPL/ })).not.toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText('How much does TSLA add to my risk?')).toBeInTheDocument(),
    )
    expect(screen.getByPlaceholderText('Ask a follow-up…')).toBeInTheDocument()
  })

  it('tells the user to sign in again when the session expired', async () => {
    const { ChatRequestError } = await import('@/app/components/services/chatService')
    analyze.mockRejectedValue(new ChatRequestError(401))
    renderChat()

    await userEvent.click(screen.getByText("Explain today's move"))

    await waitFor(() => expect(screen.getByText(SESSION_EXPIRED_ANSWER)).toBeInTheDocument())
  })
})
