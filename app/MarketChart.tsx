'use client'

import React, { useEffect, useRef, memo } from 'react'
import { useDarkMode } from './components/hooks/useDarkMode'

type MarketSymbol = { s: string; d: string }

const MARKET_CONFIG: Record<string, { symbols: MarketSymbol[] }> = {
  USA: {
    symbols: [
      { s: 'FOREXCOM:SPXUSD', d: 'S&P 500' },
      { s: 'FOREXCOM:NSXUSD', d: 'Nasdaq 100' },
    ],
  },
  Finland: {
    symbols: [{ s: 'OMXHEX:OMXH25', d: 'OMX Helsinki 25' }],
  },
}

interface MarketChartProps {
  market: string
  height?: number
}

// https://www.tradingview.com/widget-docs/widgets/watchlists/market-overview/
function TradingViewWidget({ market, height = 180 }: MarketChartProps) {
  const container = useRef<HTMLDivElement>(null)
  const hasCreatedChart = useRef(false)
  const isDarkMode = useDarkMode()

  const config = MARKET_CONFIG[market]

  useEffect(() => {
    if (!config || !container.current) return

    // Mirror the original homepage widget lifecycle so TradingView controls
    // the full chart + selector layout inside the allotted area.
    if (container.current && hasCreatedChart.current) {
      container.current.innerHTML = ''
      hasCreatedChart.current = false
    }

    if (hasCreatedChart.current) return

    container.current.innerHTML = '<div class="tradingview-widget-container__widget"></div>'

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
          symbols: config.symbols,
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

    container.current.appendChild(script)
    hasCreatedChart.current = true
  }, [isDarkMode, config])

  if (!config) return null

  const widgetHeight = Math.max(height, config.symbols.length > 1 ? 300 : 240)

  return (
    <div style={{ height: `${widgetHeight}px` }}>
      <div className="tradingview-widget-container h-full" ref={container}>
        <div className="tradingview-widget-container__widget h-full"></div>
      </div>
    </div>
  )
}

export default memo(TradingViewWidget)
