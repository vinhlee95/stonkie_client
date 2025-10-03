'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const TABS = [
  {
    label: 'Income statements',
    path: '',
  },
  {
    label: 'Balance sheet',
    path: '/balance_sheet',
  },
  {
    label: 'Cash flow',
    path: '/cash_flow',
  },
  {
    label: 'Filings',
    path: '/filing',
  },
]

export default function Tabs({ ticker }: { ticker: string }) {
  const pathname = usePathname()
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 })
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([])

  useEffect(() => {
    const activeIndex = TABS.findIndex((tab) => {
      const href = `/tickers/${ticker}/statements${tab.path}`
      return tab.path === '' ? pathname === href : pathname.includes(href)
    })

    const activeTab = tabRefs.current[activeIndex]
    if (activeTab) {
      setPillStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      })

      // Scroll the active tab into view
      activeTab.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [pathname, ticker])

  return (
    <div className="relative overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="relative flex bg-gray-100/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-full p-1.5 gap-1 w-fit">
        {/* Animated liquid glass pill that moves between tabs */}
        <div
          className="absolute top-1.5 bottom-1.5 rounded-full bg-white dark:bg-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
          style={{
            left: `${pillStyle.left}px`,
            width: `${pillStyle.width}px`,
          }}
        />

        {TABS.map((tab, index) => {
          const href = `/tickers/${ticker}/statements${tab.path}`
          const isActive = tab.path === '' ? pathname === href : pathname.includes(href)

          return (
            <Link
              key={tab.label}
              href={href}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              className={`relative px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all duration-300 z-10 whitespace-nowrap ${
                isActive
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
