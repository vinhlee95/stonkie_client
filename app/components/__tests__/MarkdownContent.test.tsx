import { fireEvent, render, screen } from '@/tests/test-utils'
import MarkdownContent from '../MarkdownContent'

describe('MarkdownContent inline source link', () => {
  it('shows tooltip on hover for inline source icon', () => {
    render(<MarkdownContent content={'See source [link](https://example.com/report)'} />)

    const linkIcon = screen.getByRole('link')
    fireEvent.mouseEnter(linkIcon.parentElement as HTMLElement)

    expect(screen.getByRole('tooltip')).toHaveTextContent('link')
  })

  it('opens tooltip to the left when near right viewport edge', () => {
    render(<MarkdownContent content={'See source [link](https://example.com/report)'} />)

    const wrapper = screen.getByRole('link').parentElement as HTMLElement
    wrapper.getBoundingClientRect = () =>
      ({
        left: 1200,
        top: 0,
        right: 1224,
        bottom: 24,
        width: 24,
        height: 24,
        x: 1200,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect

    fireEvent.mouseEnter(wrapper)
    const tooltip = screen.getByRole('tooltip')

    const style = tooltip.getAttribute('style') ?? ''
    expect(style).toContain('right:')
  })
})
