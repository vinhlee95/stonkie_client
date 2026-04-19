import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SectorFilter from '../SectorFilter'

const items = [
  { key: 'all', label: 'All Sectors' },
  { key: 'technology', label: 'Technology' },
  { key: 'financials', label: 'Financials' },
]

function mockHorizontalLayout(
  container: HTMLDivElement,
  buttons: HTMLButtonElement[],
  visibleWidth: number,
) {
  Object.defineProperty(container, 'clientWidth', {
    configurable: true,
    value: visibleWidth,
  })

  container.getBoundingClientRect = vi.fn(
    () =>
      ({
        left: 0,
        right: visibleWidth,
        top: 0,
        bottom: 40,
        width: visibleWidth,
        height: 40,
      }) as DOMRect,
  )

  buttons.forEach((button, index) => {
    const offsetLeft = index * 80
    const offsetWidth = 70

    Object.defineProperty(button, 'offsetLeft', {
      configurable: true,
      value: offsetLeft,
    })
    Object.defineProperty(button, 'offsetWidth', {
      configurable: true,
      value: offsetWidth,
    })

    button.getBoundingClientRect = vi.fn(
      () =>
        ({
          left: offsetLeft,
          right: offsetLeft + offsetWidth,
          top: 0,
          bottom: 32,
          width: offsetWidth,
          height: 32,
        }) as DOMRect,
    )
  })
}

describe('SectorFilter', () => {
  it('does not scroll when active chip is already visible', () => {
    const { rerender } = render(<SectorFilter items={items} activeKey="all" onNavigate={vi.fn()} />)

    const nav = screen.getByRole('navigation', { name: 'Sector sections' })
    const container = nav.querySelector('div') as HTMLDivElement
    const buttons = screen.getAllByRole('button') as HTMLButtonElement[]
    const scrollTo = vi.fn()
    container.scrollTo = scrollTo

    mockHorizontalLayout(container, buttons, 200)

    rerender(<SectorFilter items={items} activeKey="technology" onNavigate={vi.fn()} />)

    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('scrolls the chip container horizontally when active chip is clipped', () => {
    const { rerender } = render(<SectorFilter items={items} activeKey="all" onNavigate={vi.fn()} />)

    const nav = screen.getByRole('navigation', { name: 'Sector sections' })
    const container = nav.querySelector('div') as HTMLDivElement
    const buttons = screen.getAllByRole('button') as HTMLButtonElement[]
    const scrollTo = vi.fn()
    container.scrollTo = scrollTo

    mockHorizontalLayout(container, buttons, 120)

    rerender(<SectorFilter items={items} activeKey="financials" onNavigate={vi.fn()} />)

    expect(scrollTo).toHaveBeenCalledWith({ left: 135, behavior: 'smooth' })
  })
})
