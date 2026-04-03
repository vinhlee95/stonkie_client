import { render, screen } from '@/tests/test-utils'
import { vi, describe, it, expect } from 'vitest'
import AnswerContent from '../AnswerContent'

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

  it('renders SVG block', () => {
    const content = 'Before\n\n```svg\n<svg></svg>\n```\n\nAfter'
    render(<AnswerContent content={content} />)
    expect(screen.getByTestId('svg-block')).toBeInTheDocument()
    expect(screen.getAllByTestId('markdown')).toHaveLength(2)
  })

  it('renders HTML iframe', () => {
    const content = 'Intro\n\n```html\n<div>chart</div>\n```'
    render(<AnswerContent content={content} />)
    expect(screen.getByTestId('html-iframe')).toBeInTheDocument()
  })

  it('shows loading skeleton when text precedes a streaming visual', () => {
    // Text before an unclosed html fence — fast-path must NOT fire
    const content = 'Here is the chart:\n\n```html\n<div>partial'
    render(<AnswerContent content={content} isStreaming={true} />)
    expect(screen.getByText('Rendering visual...')).toBeInTheDocument()
    // The preceding text is still rendered
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
  })

  it('does NOT show skeleton for plain text with no pending visual', () => {
    render(<AnswerContent content="Just text" isStreaming={true} />)
    expect(screen.queryByText('Rendering visual...')).not.toBeInTheDocument()
  })

  it('does NOT show skeleton after streaming completes', () => {
    const content = 'Here is the chart:\n\n```html\n<div>complete</div>\n```'
    render(<AnswerContent content={content} isStreaming={false} />)
    expect(screen.queryByText('Rendering visual...')).not.toBeInTheDocument()
    expect(screen.getByTestId('html-iframe')).toBeInTheDocument()
  })
})
