'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type SectorNavItem = { key: string; label: string }

export interface SectorFilterProps {
  items: SectorNavItem[]
  activeKey: string
  onNavigate: (key: string) => void
  /** When true, omits the sticky/background wrapper — caller provides its own sticky container. */
  embedded?: boolean
}

export default function SectorFilter({
  items,
  activeKey,
  onNavigate,
  embedded = false,
}: SectorFilterProps) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const setButtonRef = useCallback(
    (key: string) => (el: HTMLButtonElement | null) => {
      buttonRefs.current[key] = el
    },
    [],
  )

  const recomputeIndicator = useCallback(() => {
    const el = buttonRefs.current[activeKey]
    if (!el) return
    setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeKey])

  useEffect(() => {
    recomputeIndicator()
  }, [recomputeIndicator, items])

  useEffect(() => {
    const container = scrollContainerRef.current
    const el = buttonRefs.current[activeKey]
    if (!container || !el) return

    const containerRect = container.getBoundingClientRect()
    const elementRect = el.getBoundingClientRect()
    const isLeftClipped = elementRect.left < containerRect.left
    const isRightClipped = elementRect.right > containerRect.right

    if (!isLeftClipped && !isRightClipped) return

    const targetLeft = Math.max(0, el.offsetLeft - (container.clientWidth - el.offsetWidth) / 2)
    container.scrollTo({ left: targetLeft, behavior: 'smooth' })
  }, [activeKey])

  return (
    <div
      className={
        embedded
          ? 'pb-1'
          : 'sticky top-0 z-20 -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 border-b border-gray-200/80 dark:border-gray-700/80 bg-[var(--background)] py-3'
      }
      role="navigation"
      aria-label="Sector sections"
    >
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <div
          ref={trackRef}
          className="relative inline-flex bg-gray-100/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-full p-1 gap-0.5"
        >
          <div
            className="absolute top-1 bottom-1 rounded-full bg-white dark:bg-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
            }}
          />
          {items.map((item) => {
            const selected = activeKey === item.key
            return (
              <button
                key={item.key}
                ref={setButtonRef(item.key)}
                type="button"
                onClick={() => onNavigate(item.key)}
                className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap z-10 cursor-pointer ${
                  selected
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
