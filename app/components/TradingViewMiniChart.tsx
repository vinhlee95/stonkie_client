'use client'

import { useEffect, useRef, useState, memo } from 'react'
import { toTradingViewSymbol, isRestricted } from '@/app/lib/tradingview'
import { useDarkMode } from './hooks/useDarkMode'

interface TradingViewMiniChartProps {
  ticker: string
  height?: number
  largeChartUrl?: string
}

function TradingViewMiniChart({ ticker, height = 120, largeChartUrl }: TradingViewMiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hasCreated = useRef(false)
  const [isVisible, setIsVisible] = useState(false)
  const isDarkMode = useDarkMode()

  const tvSymbol = toTradingViewSymbol(ticker)
  const restricted = isRestricted(tvSymbol)

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible || restricted || !containerRef.current) return

    if (hasCreated.current) {
      containerRef.current.innerHTML = ''
      hasCreated.current = false
    }

    const widgetOptions = {
      symbol: tvSymbol,
      width: '100%',
      height: '100%',
      dateRange: '1D',
      colorTheme: isDarkMode ? 'dark' : 'light',
      trendLineColor: '#286956',
      underLineColor: 'rgba(40,105,86,0.15)',
      underLineBottomColor: 'rgba(40,105,86,0.02)',
      isTransparent: true,
      autosize: true,
      locale: 'en',
      noTimeScale: true,
      ...(largeChartUrl ? { largeChartUrl } : {}),
    }

    const script = document.createElement('script')
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
    script.type = 'text/javascript'
    script.async = true
    script.textContent = JSON.stringify(widgetOptions)

    containerRef.current.appendChild(script)
    hasCreated.current = true
  }, [isVisible, isDarkMode, tvSymbol, restricted, largeChartUrl])

  if (restricted) {
    return (
      <div
        className="flex items-center justify-center text-xs text-gray-400 dark:text-gray-500"
        style={{ height }}
      >
        <a
          href={`https://www.tradingview.com/symbols/${tvSymbol.replace(':', '-')}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          View on TradingView
        </a>
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ height, width: '100%' }}>
      {!isVisible && (
        <div className="w-full h-full rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
      )}
    </div>
  )
}

export default memo(TradingViewMiniChart)
