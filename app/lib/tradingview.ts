export const EXCHANGE_MAP: Record<string, string> = {
  HE: 'OMXHEX',
  VN: 'HOSE',
}

const RESTRICTED_EXCHANGES = new Set(['HOSE'])

export function toTradingViewSymbol(ticker: string): string {
  const dotIndex = ticker.lastIndexOf('.')
  if (dotIndex === -1) return ticker
  const suffix = ticker.slice(dotIndex + 1).toUpperCase()
  const exchange = EXCHANGE_MAP[suffix]
  if (!exchange) {
    console.warn(`[TradingView] Unmapped exchange suffix: "${suffix}" for ticker "${ticker}"`)
    return ticker
  }
  return `${exchange}:${ticker.slice(0, dotIndex).replace(/-/g, '_')}`
}

export function isRestricted(tvSymbol: string): boolean {
  const colon = tvSymbol.indexOf(':')
  if (colon === -1) return false
  return RESTRICTED_EXCHANGES.has(tvSymbol.slice(0, colon))
}
