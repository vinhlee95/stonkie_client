import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen, within } from '@/tests/test-utils'
import type { PortfolioHolding } from '@/lib/api/portfolio'
import { HoldingModal } from '../components/HoldingModal'

const AAPL: PortfolioHolding = {
  ticker: 'AAPL',
  name: 'Apple Inc',
  shares: 10,
  avg_cost: 100,
  currency: 'USD',
  price: 210,
  day_change_percent: 1,
  trading_date: '2026-09-25',
  fx_rate: 0.8,
  value: 1680,
  cost_basis: 800,
  day_change: 16,
  total_return: 880,
  total_return_percent: 110,
  weight: 100,
}

const fetchMock = vi.fn()
beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => new Response('[]'))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

function renderModal(onSave = vi.fn().mockResolvedValue(undefined)) {
  render(
    <HoldingModal
      state={{ preset: null }}
      heldTickers={new Set(['AAPL'])}
      holdings={[AAPL]}
      onClose={() => {}}
      onSave={onSave}
      onRemove={vi.fn()}
    />,
  )
  return screen.getByRole('dialog', { name: 'Add holding' })
}

async function pick(dialog: HTMLElement, symbol: string) {
  const search = within(dialog).getByLabelText('Search ticker or company')
  await userEvent.clear(search)
  await userEvent.type(search, symbol.toLowerCase())
  await userEvent.click(
    await within(dialog).findByRole('button', { name: new RegExp(`^${symbol}`) }),
  )
}

describe('HoldingModal', () => {
  it('prefills a held ticker and clears the fields when switching to one not held', async () => {
    const dialog = renderModal()
    await pick(dialog, 'AAPL')
    expect(within(dialog).getByLabelText('Shares')).toHaveValue('10')
    expect(within(dialog).getByLabelText(/Average cost/)).toHaveValue('100')

    await userEvent.click(within(dialog).getByRole('button', { name: 'Change' }))
    await pick(dialog, 'NOPE')
    expect(within(dialog).getByLabelText('Shares')).toHaveValue('')
    expect(within(dialog).getByLabelText(/Average cost/)).toHaveValue('')
    expect(within(dialog).getByRole('button', { name: 'Add to portfolio' })).toBeDisabled()
  })

  it.each([
    ['4,123', 'Ambiguous — type 4123 or 4.123'],
    ['0,125', 'Ambiguous — type 125 or 0.125'],
  ])('asks to disambiguate %j and blocks saving', async (input, hint) => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const dialog = renderModal(onSave)
    await pick(dialog, 'NOPE')
    await userEvent.type(within(dialog).getByLabelText('Shares'), '2')
    await userEvent.type(within(dialog).getByLabelText(/Average cost/), input)

    expect(within(dialog).getByText(hint)).toBeInTheDocument()
    const add = within(dialog).getByRole('button', { name: 'Add to portfolio' })
    expect(add).toBeDisabled()

    await userEvent.clear(within(dialog).getByLabelText(/Average cost/))
    await userEvent.type(within(dialog).getByLabelText(/Average cost/), input.replace(',', '.'))
    expect(within(dialog).queryByText(/Ambiguous/)).not.toBeInTheDocument()
    await userEvent.click(add)
    expect(onSave).toHaveBeenCalledWith('NOPE', {
      shares: 2,
      avg_cost: Number(input.replace(',', '.')),
      name: null,
    })
  })
})
