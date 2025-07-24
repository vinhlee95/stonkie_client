'use client'

import React, { useEffect, useRef, memo } from 'react'

function TradingViewWidget({ ticker }: { ticker: string }) {
  const container = useRef<HTMLDivElement>(null)
  const hasCreatedChart = useRef<boolean>(false)

  useEffect(() => {
    if (hasCreatedChart.current) {
      return
    }

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = `
        {
          "lineWidth": 2,
          "lineType": 0,
          "chartType": "area",
          "fontColor": "rgb(0, 0, 0)",
          "gridLineColor": "rgba(242, 242, 242, 0.06)",
          "volumeUpColor": "rgba(34, 171, 148, 0.5)",
          "volumeDownColor": "rgba(247, 82, 95, 0.5)",
          "upColor": "#22ab94",
          "downColor": "#f7525f",
          "borderUpColor": "#22ab94",
          "borderDownColor": "#f7525f",
          "wickUpColor": "#22ab94",
          "wickDownColor": "#f7525f",
          "isTransparent": true,
          "locale": "en",
          "chartOnly": true,
          "scalePosition": "right",
          "scaleMode": "Normal",
          "valuesTracking": "1",
          "changeMode": "price-and-percent",
          "symbols": [
            [
              "${ticker}|YTD"
            ]
          ],
          "dateRanges": [
            "12m|1D",
            "60m|1W",
            "ytd|1D",
            "all|1M"
          ],
          "fontSize": "10",
          "headerFontSize": "small",
          "autosize": true,
          "width": "100%",
          "height": "100%",
          "noTimeScale": false,
          "hideDateRanges": false,
          "hideMarketStatus": true,
          "hideSymbolLogo": true
        }`

    if (container.current) {
      container.current.appendChild(script)
      hasCreatedChart.current = true
    }
  }, [])

  return (
    <div className="h-[250px] mb-6">
      <div className="tradingview-widget-container" ref={container}>
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  )
}

export default memo(TradingViewWidget)
