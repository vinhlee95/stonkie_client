import { render, screen } from '@/tests/test-utils'
import { ThreadView } from '../Chat'
import { NormalThread } from '../hooks/useChatState'

function makeThread(overrides: Partial<NormalThread>): NormalThread {
  return {
    id: 'thread-1',
    question: 'What changed?',
    thoughts: [],
    answer: 'Plain answer',
    relatedQuestions: [],
    grounds: [],
    sources: [],
    visualBlocks: [],
    modelName: undefined,
    attachment: undefined,
    ...overrides,
  }
}

describe('ThreadView sources footer', () => {
  it('renders structured sources and suppresses grounds when sources exist', () => {
    render(
      <ThreadView
        thread={makeThread({
          sources: [
            {
              sourceId: 's1',
              url: 'https://www.reuters.com/story',
              publisher: 'Reuters',
              title: '',
            },
          ],
          grounds: [{ body: 'Ground source', url: 'https://ground.example.com' }],
        })}
        onFAQClick={() => {}}
        isLastThread
        isThinking={false}
      />,
    )

    expect(screen.getByRole('link', { name: /^reuters$/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /ground source/i })).not.toBeInTheDocument()
  })

  it('renders grounds when no structured sources are present', () => {
    render(
      <ThreadView
        thread={makeThread({
          sources: [],
          grounds: [{ body: 'Ground source', url: 'https://ground.example.com' }],
        })}
        onFAQClick={() => {}}
        isLastThread
        isThinking={false}
      />,
    )

    expect(screen.getByRole('link', { name: /ground source/i })).toBeInTheDocument()
  })
})
