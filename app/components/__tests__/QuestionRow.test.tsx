import { render, screen, fireEvent } from '@testing-library/react'
import QuestionRow from '../chat/QuestionRow'

describe('QuestionRow', () => {
  const question = 'Which market had the strongest performance today?'

  it('renders the question text', () => {
    render(<QuestionRow question={question} onAsk={vi.fn()} />)
    expect(screen.getByText(question)).toBeInTheDocument()
  })

  it('calls onAsk with the question when clicked', () => {
    const onAsk = vi.fn()
    render(<QuestionRow question={question} onAsk={onAsk} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onAsk).toHaveBeenCalledWith(question)
    expect(onAsk).toHaveBeenCalledTimes(1)
  })

  it('renders as a button element', () => {
    render(<QuestionRow question={question} onAsk={vi.fn()} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
