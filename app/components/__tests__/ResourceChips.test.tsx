import { render, screen } from '@/tests/test-utils'
import ResourceChips from '../ResourceChips'

describe('ResourceChips', () => {
  const mockResources = [
    { url: 'https://example.com/1', label: 'Resource 1' },
    { url: 'https://example.com/2', label: 'Resource 2' },
  ]

  it('renders all resource chips', () => {
    render(<ResourceChips resources={mockResources} />)

    expect(screen.getByText('Resource 1')).toBeInTheDocument()
    expect(screen.getByText('Resource 2')).toBeInTheDocument()
  })

  it('renders links with correct URLs and attributes', () => {
    render(<ResourceChips resources={mockResources} />)

    const link1 = screen.getByRole('link', { name: 'Resource 1' })
    expect(link1).toHaveAttribute('href', 'https://example.com/1')
    expect(link1).toHaveAttribute('target', '_blank')
    expect(link1).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders empty when no resources provided', () => {
    const { container } = render(<ResourceChips resources={[]} />)
    expect(container.querySelector('a')).not.toBeInTheDocument()
  })
})
