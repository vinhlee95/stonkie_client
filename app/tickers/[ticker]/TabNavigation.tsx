'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useMemo } from 'react'

export default function TabNavigation({ ticker }: { ticker: string }) {
  const pathname = usePathname()
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([])

  const tabs = useMemo(
    () => [
      { label: 'Overview', path: `/tickers/${ticker}` },
      { label: 'Reports', path: `/tickers/${ticker}/statements` },
      { label: 'Insights', path: `/tickers/${ticker}/insights/growth` },
    ],
    [ticker],
  )

  const checkActiveTab = (currentPathName: string, mainTabPath: string): boolean => {
    if (mainTabPath.includes('insights')) return currentPathName.includes('insights')
    if (mainTabPath.includes('statements')) return currentPathName.includes('statements')
    return currentPathName === mainTabPath
  }

  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => checkActiveTab(pathname, tab.path))
    const activeTab = tabRefs.current[activeIndex]

    if (activeTab) {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      })
    }
  }, [pathname, tabs])

  return (
    <div className="relative py-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="relative flex bg-gray-100/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-full p-1.5 gap-1 w-fit">
        {/* Animated liquid glass pill that moves between tabs */}
        <div
          className="absolute top-1.5 bottom-1.5 rounded-full bg-white dark:bg-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />

        {tabs.map((tab, index) => {
          const isActive = checkActiveTab(pathname, tab.path)
          return (
            <Link
              key={tab.path}
              href={tab.path}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              className={`relative px-6 py-2.5 rounded-full text-base font-medium transition-all duration-300 z-10 whitespace-nowrap ${
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
