import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen, within } from '@/tests/test-utils'
import type { PortfolioHolding } from '@/lib/api/portfolio'
import {
  HoldingModal,
  type HoldingActions,
  type HoldingModalState,
} from '../components/HoldingModal'

const AAPL: PortfolioHolding = {
  ticker: 'AAPL',
  name: 'Apple Inc',
  shares: 15,
  avg_cost: 120,
  lots: [
    { id: 'lot-new', shares: 5, price: 160, purchased_on: '2025-06-01' },
    { id: 'lot-old', shares: 10, price: 100, purchased_on: null },
  ],
  currency: 'USD',
  price: 210,
  day_change_percent: 1,
  trading_date: '2026-09-25',
  as_of: null,
  delayed: false,
  fx_rate: 0.8,
  value: 2520,
  cost_basis: 1440,
  day_change: 16,
  total_return: 1080,
  total_return_percent: 75,
  weight: 100,
  sector: 'Technology',
  country: 'United States',
  asset_type: 'Stock',
}

const fetchMock = vi.fn()
beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => new Response('[]'))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

function makeActions(): HoldingActions {
  return {
    addHolding: vi.fn().mockResolvedValue(undefined),
    addLot: vi.fn().mockResolvedValue(undefined),
    updateLot: vi.fn().mockResolvedValue(undefined),
    deleteLot: vi.fn().mockResolvedValue(undefined),
    removeHolding: vi.fn().mockResolvedValue(undefined),
  }
}

function renderModal(state: HoldingModalState, holdings = [AAPL]) {
  const actions = makeActions()
  const onClose = vi.fn()
  const view = render(
    <HoldingModal state={state} holdings={holdings} actions={actions} onClose={onClose} />,
  )
  return { actions, onClose, ...view }
}

async function pick(dialog: HTMLElement, symbol: string) {
  const search = within(dialog).getByLabelText('Search ticker or company')
  await userEvent.clear(search)
  await userEvent.type(search, symbol.toLowerCase())
  await userEvent.click(
    await within(dialog).findByRole('button', { name: new RegExp(`^${symbol}`) }),
  )
}

describe('HoldingModal — add view', () => {
  it('adds a new lot to a held ticker without prefilling it', async () => {
    const { actions, onClose } = renderModal({ preset: null })
    const dialog = screen.getByRole('dialog', { name: 'Add holding' })
    await pick(dialog, 'AAPL')

    expect(
      within(dialog).getByText(/You hold 15 shares @ \$120\.00 avg\. This adds a new lot\./),
    ).toBeInTheDocument()
    expect(within(dialog).queryByText(/replace/)).not.toBeInTheDocument()
    expect(within(dialog).getByLabelText('Shares')).toHaveValue('')

    await userEvent.type(within(dialog).getByLabelText('Shares'), '2')
    await userEvent.type(within(dialog).getByLabelText(/Price per share/), '200')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add to portfolio' }))

    expect(actions.addHolding).toHaveBeenCalledWith('AAPL', {
      shares: 2,
      price: 200,
      purchased_on: null,
      name: null,
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('clears typed values when switching ticker', async () => {
    renderModal({ preset: null })
    const dialog = screen.getByRole('dialog', { name: 'Add holding' })
    await pick(dialog, 'NOPE')
    await userEvent.type(within(dialog).getByLabelText('Shares'), '3')

    await userEvent.click(within(dialog).getByRole('button', { name: 'Change' }))
    await pick(dialog, 'MSFT')
    expect(within(dialog).getByLabelText('Shares')).toHaveValue('')
    expect(within(dialog).queryByText(/You hold/)).not.toBeInTheDocument()
  })

  it('adds a Finnhub-style favourite preset under its Yahoo symbol', async () => {
    const { actions } = renderModal({
      preset: { ticker: 'BRK.B', name: 'Berkshire Hathaway B' },
    })
    const dialog = screen.getByRole('dialog', { name: 'Add holding' })
    expect(within(dialog).getByText('BRK-B')).toBeInTheDocument()
    await userEvent.type(within(dialog).getByLabelText('Shares'), '1')
    await userEvent.type(within(dialog).getByLabelText(/Price per share/), '400')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add to portfolio' }))
    expect(actions.addHolding).toHaveBeenCalledWith('BRK-B', {
      shares: 1,
      price: 400,
      purchased_on: null,
      name: 'Berkshire Hathaway B',
    })
  })

  it('maps a typed raw class symbol to its Yahoo form', async () => {
    const { actions } = renderModal({ preset: null })
    const dialog = screen.getByRole('dialog', { name: 'Add holding' })
    await userEvent.type(within(dialog).getByLabelText('Search ticker or company'), 'brk.b')
    await userEvent.click(await within(dialog).findByRole('button', { name: /^BRK-B/ }))
    expect(within(dialog).queryByRole('button', { name: /^BRK\.B/ })).not.toBeInTheDocument()
    await userEvent.type(within(dialog).getByLabelText('Shares'), '1')
    await userEvent.type(within(dialog).getByLabelText(/Price per share/), '400')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add to portfolio' }))
    expect(actions.addHolding).toHaveBeenCalledWith('BRK-B', {
      shares: 1,
      price: 400,
      purchased_on: null,
      name: null,
    })
  })
})

describe('HoldingModal — position view', () => {
  it('lists lots newest first with an undated fallback', () => {
    renderModal({ ticker: 'AAPL' })
    const dialog = screen.getByRole('dialog', { name: 'Edit AAPL' })
    const [first, second] = within(
      within(dialog).getByRole('list', { name: 'Lots' }),
    ).getAllByRole('listitem')
    expect(first).toHaveTextContent('1 Jun 2025')
    expect(first).toHaveTextContent('5 × $160.00')
    expect(second).toHaveTextContent('No date')
    expect(second).toHaveTextContent('$1,000.00')
    expect(within(dialog).getByText('$1,800.00')).toBeInTheDocument() // position cost basis
  })

  it('edits a lot inline', async () => {
    const { actions } = renderModal({ ticker: 'AAPL' })
    const [first] = within(screen.getByRole('list', { name: 'Lots' })).getAllByRole('listitem')
    await userEvent.click(within(first).getByRole('button', { name: 'Edit lot' }))
    const shares = within(first).getByLabelText('Shares')
    await userEvent.clear(shares)
    await userEvent.type(shares, '6')
    await userEvent.click(within(first).getByRole('button', { name: 'Save lot' }))

    expect(actions.updateLot).toHaveBeenCalledWith('lot-new', {
      shares: 6,
      price: 160,
      purchased_on: '2025-06-01',
    })
    expect(within(first).queryByLabelText('Shares')).not.toBeInTheDocument()
  })

  it('deletes a lot only after confirming', async () => {
    const { actions } = renderModal({ ticker: 'AAPL' })
    const [, second] = within(screen.getByRole('list', { name: 'Lots' })).getAllByRole('listitem')
    await userEvent.click(within(second).getByRole('button', { name: 'Delete lot' }))
    await userEvent.click(within(second).getByRole('button', { name: 'Keep' }))
    expect(actions.deleteLot).not.toHaveBeenCalled()

    await userEvent.click(within(second).getByRole('button', { name: 'Delete lot' }))
    await userEvent.click(within(second).getByRole('button', { name: 'Delete' }))
    expect(actions.deleteLot).toHaveBeenCalledWith('lot-old')
  })

  it('shows a failed lot delete', async () => {
    const { actions } = renderModal({ ticker: 'AAPL' })
    vi.mocked(actions.deleteLot).mockRejectedValue(new Error('Lot not found'))
    const [first] = within(screen.getByRole('list', { name: 'Lots' })).getAllByRole('listitem')
    await userEvent.click(within(first).getByRole('button', { name: 'Delete lot' }))
    await userEvent.click(within(first).getByRole('button', { name: 'Delete' }))
    expect(await within(first).findByRole('alert')).toHaveTextContent('Lot not found')
  })

  it('adds a lot to the position', async () => {
    const { actions } = renderModal({ ticker: 'AAPL' })
    await userEvent.click(screen.getByRole('button', { name: 'Add lot' }))
    await userEvent.type(screen.getByLabelText('Shares'), '1')
    await userEvent.type(screen.getByLabelText(/Price per share/), '210')
    await userEvent.click(screen.getByRole('button', { name: 'Add lot' }))

    expect(actions.addLot).toHaveBeenCalledWith('AAPL', {
      shares: 1,
      price: 210,
      purchased_on: null,
      name: 'Apple Inc',
    })
    expect(screen.queryByLabelText('Shares')).not.toBeInTheDocument()
  })

  it('removes the whole position after confirming', async () => {
    const { actions, onClose } = renderModal({ ticker: 'AAPL' })
    await userEvent.click(screen.getByRole('button', { name: 'Remove position' }))
    expect(screen.getByText('Remove AAPL and its 2 lots?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Yes, remove' }))

    expect(actions.removeHolding).toHaveBeenCalledWith('AAPL')
    expect(onClose).toHaveBeenCalled()
  })

  it('closes when the position disappears', () => {
    const { actions, onClose, rerender } = renderModal({ ticker: 'AAPL' })
    rerender(
      <HoldingModal state={{ ticker: 'AAPL' }} holdings={[]} actions={actions} onClose={onClose} />,
    )
    expect(onClose).toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
