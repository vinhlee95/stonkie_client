import { afterEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen } from '@/tests/test-utils'
import type { PortfolioLot } from '@/lib/api/portfolio'
import { LotForm } from '../components/LotForm'

const LOT: PortfolioLot = { id: 'lot-1', shares: 10, price: 100, purchased_on: '2025-01-02' }

afterEach(() => vi.useRealTimers())

function renderForm(props: Partial<Parameters<typeof LotForm>[0]> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<LotForm currency="EUR" submitLabel="Add lot" onSubmit={onSubmit} {...props} />)
  return onSubmit
}

describe('LotForm', () => {
  it('submits shares, price and no date by default', async () => {
    const onSubmit = renderForm()
    await userEvent.type(screen.getByLabelText('Shares'), '5')
    await userEvent.type(screen.getByLabelText('Price per share (EUR)'), '388,69')

    expect(screen.getByText('€1,943.45')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add lot' }))
    expect(onSubmit).toHaveBeenCalledWith({ shares: 5, price: 388.69, purchased_on: null })
  })

  it('submits a purchase date', async () => {
    const onSubmit = renderForm()
    await userEvent.type(screen.getByLabelText('Shares'), '1')
    await userEvent.type(screen.getByLabelText(/Price per share/), '2')
    fireEvent.change(screen.getByLabelText(/Purchase date/), { target: { value: '2025-03-12' } })
    await userEvent.click(screen.getByRole('button', { name: 'Add lot' }))
    expect(onSubmit).toHaveBeenCalledWith({ shares: 1, price: 2, purchased_on: '2025-03-12' })
  })

  it('blocks a purchase date in the future', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 8, 30, 12))
    const onSubmit = renderForm()
    await userEvent.type(screen.getByLabelText('Shares'), '1')
    await userEvent.type(screen.getByLabelText(/Price per share/), '2')

    fireEvent.change(screen.getByLabelText(/Purchase date/), { target: { value: '2026-10-01' } })
    expect(screen.getByText('Enter a purchase date between 1900 and today')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add lot' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/Purchase date/), { target: { value: '2026-09-30' } })
    expect(screen.getByRole('button', { name: 'Add lot' })).toBeEnabled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it.each([
    ['4,123', 'Ambiguous — type 4123 or 4.123'],
    ['1abc', 'Enter positive numbers, e.g. 12 or 12.5'],
  ])('rejects %j', async (input, hint) => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Shares'), '2')
    await userEvent.type(screen.getByLabelText(/Price per share/), input)
    expect(screen.getByText(hint)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add lot' })).toBeDisabled()
  })

  it('prefills an existing lot and can clear its date', async () => {
    const onSubmit = renderForm({ initial: LOT, submitLabel: 'Save lot' })
    expect(screen.getByLabelText('Shares')).toHaveValue('10')
    expect(screen.getByLabelText(/Price per share/)).toHaveValue('100')
    expect(screen.getByLabelText(/Purchase date/)).toHaveValue('2025-01-02')

    fireEvent.change(screen.getByLabelText(/Purchase date/), { target: { value: '' } })
    await userEvent.click(screen.getByRole('button', { name: 'Save lot' }))
    expect(onSubmit).toHaveBeenCalledWith({ shares: 10, price: 100, purchased_on: null })
  })

  it('shows a failed submit and keeps the values', async () => {
    renderForm({ initial: LOT, onSubmit: vi.fn().mockRejectedValue(new Error('Lot not found')) })
    await userEvent.click(screen.getByRole('button', { name: 'Add lot' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Lot not found')
    expect(screen.getByLabelText('Shares')).toHaveValue('10')
  })

  it('cancels', async () => {
    const onCancel = vi.fn()
    renderForm({ onCancel })
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('explains the currency when the ticker is not priced yet', () => {
    renderForm({ currency: null })
    expect(screen.getByLabelText('Price per share')).toBeInTheDocument()
    expect(screen.getByText(/currency the stock trades in/)).toBeInTheDocument()
  })
})
