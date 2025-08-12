'use client'

import React, { useEffect, useRef, memo } from 'react'
import { useDarkMode } from '../../components/hooks/useDarkMode'

function TradingViewWidget({ ticker }: { ticker: string }) {
  const container = useRef<HTMLDivElement>(null)
  const hasCreatedChart = useRef<boolean>(false)
  const isDarkMode = useDarkMode()

  useEffect(() => {
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
      fontColor: isDarkMode ? 'rgb(106, 109, 120)' : 'rgb(106, 109, 120)',
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
      symbols: [[ticker, `${ticker}|YTD`]],
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

  return (
    <div className="h-[250px] mb-6">
      <div className="tradingview-widget-container" ref={container}>
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  )
}

export default memo(TradingViewWidget)
