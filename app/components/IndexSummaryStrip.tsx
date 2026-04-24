'use client'

import { useEffect, useRef, memo } from 'react'
import { useDarkMode } from './hooks/useDarkMode'

const SYMBOLS = [
  { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
  { proName: 'OMXHEX:OMXH25', title: 'OMX H25' },
  { proName: 'FOREXCOM:NSXUSD', title: 'Nasdaq 100' },
  { proName: 'INDEX:NKY', title: 'Nikkei 225' },
]

function IndexSummaryStrip() {
  const container = useRef<HTMLDivElement>(null)
  const isDarkMode = useDarkMode()

  useEffect(() => {
    if (!container.current) return

    container.current.innerHTML = '<div class="tradingview-widget-container__widget"></div>'

    const widgetOptions = {
      symbols: SYMBOLS,
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'regular',
      colorTheme: isDarkMode ? 'dark' : 'light',
      locale: 'en',
    }

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js'
    script.type = 'text/javascript'
    script.async = true
    script.textContent = JSON.stringify(widgetOptions)

    container.current.appendChild(script)
  }, [isDarkMode])

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  )
}

export default memo(IndexSummaryStrip)
