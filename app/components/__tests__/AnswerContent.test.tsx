import { render, screen } from '@/tests/test-utils'
import { vi, describe, it, expect } from 'vitest'
import AnswerContent from '../AnswerContent'
import { VisualBlock } from '../hooks/useChatState'

vi.mock('dompurify', () => ({
  default: { sanitize: (_: string, __: unknown) => _ },
}))

vi.mock('../MarkdownContent', () => ({
  default: ({ content }: { content: string }) => <div data-testid="markdown">{content}</div>,
}))

vi.mock('../SvgBlock', () => ({
  default: ({ content }: { content: string }) => <div data-testid="svg-block">{content}</div>,
}))

vi.mock('../HtmlIframe', () => ({
  default: ({ content }: { content: string }) => <div data-testid="html-iframe">{content}</div>,
}))

describe('AnswerContent', () => {
  it('renders plain text via MarkdownContent fast path', () => {
    render(<AnswerContent content="Hello world" />)
    expect(screen.getByTestId('markdown')).toHaveTextContent('Hello world')
    expect(screen.queryByTestId('svg-block')).not.toBeInTheDocument()
  })

  it('renders SVG block when marker is completed', () => {
    const content = 'Before\n\n[[VISUAL_BLOCK:vis_1]]\n\nAfter'
    const visualBlocks: VisualBlock[] = [
      { blockId: 'vis_1', lang: 'svg', content: '<svg></svg>', status: 'done' },
    ]
    render(<AnswerContent content={content} visualBlocks={visualBlocks} />)
    expect(screen.getByTestId('svg-block')).toBeInTheDocument()
    expect(screen.getAllByTestId('markdown')).toHaveLength(2)
  })

  it('renders HTML iframe when marker is completed', () => {
    const content = 'Intro\n\n[[VISUAL_BLOCK:vis_1]]'
    const visualBlocks: VisualBlock[] = [
      { blockId: 'vis_1', lang: 'html', content: '<div>chart</div>', status: 'done' },
    ]
    render(<AnswerContent content={content} visualBlocks={visualBlocks} />)
    expect(screen.getByTestId('html-iframe')).toBeInTheDocument()
  })

  it('shows loading skeleton when visual block is still streaming', () => {
    const content = 'Here is the chart:\n\n[[VISUAL_BLOCK:vis_1]]'
    const visualBlocks: VisualBlock[] = [
      { blockId: 'vis_1', lang: 'html', content: '<div>partial', status: 'streaming' },
    ]
    render(<AnswerContent content={content} visualBlocks={visualBlocks} />)
    expect(screen.getByText('Rendering visual...')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
  })

  it('shows visual error message when block fails', () => {
    const content = '[[VISUAL_BLOCK:vis_1]]'
    const visualBlocks: VisualBlock[] = [
      {
        blockId: 'vis_1',
        lang: 'html',
        content: '',
        status: 'error',
        errorMessage: 'Could not render chart.',
      },
    ]
    render(<AnswerContent content={content} visualBlocks={visualBlocks} />)
    expect(screen.getByText('Could not render chart.')).toBeInTheDocument()
  })

  it('shows fallback error text when error block has no errorMessage', () => {
    const content = '[[VISUAL_BLOCK:vis_1]]'
    const visualBlocks: VisualBlock[] = [
      { blockId: 'vis_1', lang: 'html', content: '', status: 'error' },
    ]
    render(<AnswerContent content={content} visualBlocks={visualBlocks} />)
    expect(screen.getByText('Failed to render visual content.')).toBeInTheDocument()
  })

  it('shows skeleton when marker blockId is not in visualBlocks', () => {
    const content = '[[VISUAL_BLOCK:vis_unknown]]'
    render(<AnswerContent content={content} visualBlocks={[]} />)
    expect(screen.getByText('Rendering visual...')).toBeInTheDocument()
  })

  it('renders multiple visual blocks with interleaved text', () => {
    const content = 'Intro\n\n[[VISUAL_BLOCK:vis_1]]\n\nMiddle\n\n[[VISUAL_BLOCK:vis_2]]\n\nEnd'
    const visualBlocks: VisualBlock[] = [
      { blockId: 'vis_1', lang: 'svg', content: '<svg>A</svg>', status: 'done' },
      { blockId: 'vis_2', lang: 'html', content: '<div>B</div>', status: 'done' },
    ]
    render(<AnswerContent content={content} visualBlocks={visualBlocks} />)
    expect(screen.getAllByTestId('markdown')).toHaveLength(3)
    expect(screen.getByTestId('svg-block')).toBeInTheDocument()
    expect(screen.getByTestId('html-iframe')).toBeInTheDocument()
  })
})
