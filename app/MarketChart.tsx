'use client'

import React, { useEffect, useRef, memo } from 'react'
import { useDarkMode } from './components/hooks/useDarkMode'

// https://www.tradingview.com/widget-docs/widgets/watchlists/market-overview/
function TradingViewWidget() {
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
      colorTheme: isDarkMode ? 'dark' : 'light',
      dateRange: '12M',
      locale: 'en',
      largeChartUrl: '',
      isTransparent: false,
      showFloatingTooltip: true,
      plotLineColorGrowing: 'rgba(41, 98, 255, 1)',
      plotLineColorFalling: 'rgba(41, 98, 255, 1)',
      gridLineColor: 'rgba(240, 243, 250, 0)',
      scaleFontColor: isDarkMode ? '#ffffff' : '#0F0F0F',
      belowLineFillColorGrowing: 'rgba(41, 98, 255, 0.12)',
      belowLineFillColorFalling: 'rgba(41, 98, 255, 0.12)',
      belowLineFillColorGrowingBottom: 'rgba(41, 98, 255, 0)',
      belowLineFillColorFallingBottom: 'rgba(41, 98, 255, 0)',
      symbolActiveColor: 'rgba(41, 98, 255, 0.12)',
      tabs: [
        {
          title: 'Indices',
          symbols: [
            {
              s: 'FOREXCOM:SPXUSD',
              d: 'S&P 500 Index',
            },
            {
              s: 'NASDAQ:NDX',
              d: '',
              logoid: 'indices/nasdaq-100',
              'currency-logoid': 'country/US',
            },
            {
              s: 'HOSE:VNINDEX',
              d: 'VN Index',
              logoid: 'indices/vietnam-index',
              'currency-logoid': 'country/VN',
            },
            {
              s: 'NASDAQ:OMXH25',
              d: '',
              'currency-logoid': 'country/EU',
            },
          ],
          originalTitle: 'Indices',
        },
      ],
      support_host: 'https://www.tradingview.com',
      width: '100%',
      height: '100%',
      showSymbolLogo: true,
      showChart: true,
    }

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js'
    script.type = 'text/javascript'
    script.async = true
    script.textContent = JSON.stringify(widgetOptions)

    if (container.current) {
      container.current.appendChild(script)
      hasCreatedChart.current = true
    }
  }, [isDarkMode])

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  )
}

export default memo(TradingViewWidget)
