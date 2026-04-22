'use client'

import React, { useEffect, useRef, memo } from 'react'
import { useDarkMode } from '../../components/hooks/useDarkMode'

const EXCHANGE_MAP: Record<string, string> = {
  HE: 'OMXHEX',
  VN: 'HOSE',
}

// Exchanges whose chart data TradingView's free embed widget gates
// ("This symbol is only available on TradingView"). We link out instead.
const RESTRICTED_EXCHANGES = new Set(['HOSE'])

function toTradingViewSymbol(ticker: string): string {
  const dotIndex = ticker.lastIndexOf('.')
  if (dotIndex === -1) return ticker
  const suffix = ticker.slice(dotIndex + 1).toUpperCase()
  const exchange = EXCHANGE_MAP[suffix]
  if (!exchange) {
    console.warn(`[PriceChart] Unmapped exchange suffix: "${suffix}" for ticker "${ticker}"`)
    return ticker
  }
  return `${exchange}:${ticker.slice(0, dotIndex).replace(/-/g, '_')}`
}

function isRestricted(tvSymbol: string): boolean {
  const colon = tvSymbol.indexOf(':')
  if (colon === -1) return false
  return RESTRICTED_EXCHANGES.has(tvSymbol.slice(0, colon))
}

function TradingViewLinkOut({ ticker, tvSymbol }: { ticker: string; tvSymbol: string }) {
  const href = `https://www.tradingview.com/symbols/${tvSymbol.replace(':', '-')}/`
  return (
    <div className="mb-6 px-4 py-3 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-x-2 gap-y-1">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Live chart for {ticker} is not available here.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        View chart on TradingView →
      </a>
    </div>
  )
}

function TradingViewWidget({ ticker }: { ticker: string }) {
  const container = useRef<HTMLDivElement>(null)
  const hasCreatedChart = useRef<boolean>(false)
  const isDarkMode = useDarkMode()

  const tvSymbol = toTradingViewSymbol(ticker)
  const restricted = isRestricted(tvSymbol)

  useEffect(() => {
    if (restricted) return

    // Clear existing chart if theme changes
    if (container.current && hasCreatedChart.current) {
      container.current.innerHTML = ''
      hasCreatedChart.current = false
    }

    if (hasCreatedChart.current) {
      return
    }

    const widgetOptions = {
      lineWidth: 2,
      lineType: 0,
      chartType: 'area',
      fontColor: 'rgb(106, 109, 120)',
      gridLineColor: isDarkMode ? 'rgba(242, 242, 242, 0.06)' : 'rgba(46, 46, 46, 0.06)',
      volumeUpColor: 'rgba(34, 171, 148, 0.5)',
      volumeDownColor: 'rgba(247, 82, 95, 0.5)',
      backgroundColor: isDarkMode ? '#0F0F0F' : '#ffffff',
      widgetFontColor: isDarkMode ? '#DBDBDB' : '#0F0F0F',
      upColor: '#22ab94',
      downColor: '#f7525f',
      borderUpColor: '#22ab94',
      borderDownColor: '#f7525f',
      wickUpColor: '#22ab94',
      wickDownColor: '#f7525f',
      colorTheme: isDarkMode ? 'dark' : 'light',
      isTransparent: false,
      locale: 'en',
      chartOnly: false,
      scalePosition: 'right',
      scaleMode: 'Normal',
      fontFamily: '-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif',
      valuesTracking: '1',
      changeMode: 'price-and-percent',
      symbols: [[tvSymbol, `${tvSymbol}|YTD`]],
      dateRanges: ['12m|1D', '60m|1W', 'ytd|1D', 'all|1M'],
      fontSize: '10',
      headerFontSize: 'medium',
      autosize: true,
      width: '100%',
      height: '100%',
      noTimeScale: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: true,
    }

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js'
    script.type = 'text/javascript'
    script.async = true
    script.textContent = JSON.stringify(widgetOptions)

    if (container.current) {
      container.current.appendChild(script)
      hasCreatedChart.current = true
    }
  }, [isDarkMode, ticker])

  if (restricted) {
    return <TradingViewLinkOut ticker={ticker} tvSymbol={tvSymbol} />
  }

  return (
    <div className="h-[250px] mb-6">
      <div className="tradingview-widget-container" ref={container}>
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  )
}

export default memo(TradingViewWidget)
