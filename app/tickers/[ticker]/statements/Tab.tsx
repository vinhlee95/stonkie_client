'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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

  return (
    <div className="relative">
      <div
        className="flex space-x-4 mb-6 overflow-x-auto whitespace-nowrap pb-2 sm:pb-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {TABS.map((tab) => {
          const href = `/tickers/${ticker}/statements${tab.path}`
          const isActive = tab.path === '' ? pathname === href : pathname.includes(href)

          return (
            <Link key={tab.label} href={href}>
              <button
                className={`px-3 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base font-medium flex-shrink-0 transition-colors duration-200 ${
                  isActive
                    ? 'bg-[var(--tab-active)] dark:bg-[var(--tab-active-dark)] text-white'
                    : 'bg-[var(--button-background)] dark:bg-[var(--button-background-dark)] text-gray-900 dark:text-white hover:bg-[var(--button-hover)] dark:hover:bg-[var(--button-hover-dark)]'
                }`}
              >
                {tab.label}
              </button>
            </Link>
          )
        })}
        {/* Spacer to ensure partial visibility of last tab */}
        <div className="w-8 sm:w-0 flex-shrink-0"></div>
      </div>
      {/* Fade gradient overlay for mobile only */}
      <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-[var(--background)] via-[var(--background)]/80 to-transparent pointer-events-none sm:hidden"></div>
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
