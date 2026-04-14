'use client'

import { useCallback, useEffect, useRef } from 'react'

export type SectorNavItem = { key: string; label: string }

export interface SectorFilterProps {
  items: SectorNavItem[]
  activeKey: string
  onNavigate: (key: string) => void
}

export default function SectorFilter({ items, activeKey, onNavigate }: SectorFilterProps) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const setButtonRef = useCallback(
    (key: string) => (el: HTMLButtonElement | null) => {
      buttonRefs.current[key] = el
    },
    [],
  )

  useEffect(() => {
    const el = buttonRefs.current[activeKey]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }
  }, [activeKey])

  return (
    <div
      className="sticky top-0 z-20 -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 border-b border-gray-200/80 dark:border-gray-700/80 bg-[var(--background)] py-3"
      role="navigation"
      aria-label="Sector sections"
    >
      <div className="flex gap-2 overflow-x-auto sm:flex-wrap pb-1 sm:pb-0">
        {items.map((item) => {
          const selected = activeKey === item.key
          return (
            <button
              key={item.key}
              ref={setButtonRef(item.key)}
              type="button"
              onClick={() => onNavigate(item.key)}
              style={
                selected
                  ? {
                      backgroundColor: 'var(--accent-active)',
                      color: 'white',
                    }
                  : undefined
              }
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer ${
                selected
                  ? 'dark:bg-[var(--accent-active-dark)]'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
