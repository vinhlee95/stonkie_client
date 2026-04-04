export const formatNumber = (num: number, currencySymbol?: string, inThousands = true): string => {
  const isNegative = num < 0
  const absNum = Math.abs(num)
  let result = ''

  if (inThousands) {
    // Input is in thousands (financial statement tables)
    if (absNum >= 1e9) result = `${(absNum / 1e9).toFixed(2)}T`
    else if (absNum >= 1e6) result = `${(absNum / 1e6).toFixed(2)}B`
    else if (absNum >= 1e3) result = `${(absNum / 1e3).toFixed(2)}M`
    else result = `${absNum.toFixed(2)}`
  } else {
    // Input is in full units (key stats from yfinance / Alpha Vantage)
    if (absNum >= 1e12) result = `${(absNum / 1e12).toFixed(2)}T`
    else if (absNum >= 1e9) result = `${(absNum / 1e9).toFixed(2)}B`
    else if (absNum >= 1e6) result = `${(absNum / 1e6).toFixed(2)}M`
    else if (absNum >= 1e3) result = `${(absNum / 1e3).toFixed(2)}K`
    else result = `${absNum.toFixed(2)}`
  }

  return `${isNegative ? '-' : ''}${currencySymbol ?? ''}${result}`
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
  CHF: 'Fr',
  HKD: 'HK$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  SGD: 'S$',
  KRW: '₩',
  INR: '₹',
  BRL: 'R$',
  MXN: 'Mex$',
  ZAR: 'R',
  CNY: '¥',
  TWD: 'NT$',
  NZD: 'NZ$',
  VND: '₫',
}

export const getCurrencySymbol = (currency: string): string =>
  CURRENCY_SYMBOLS[currency?.toUpperCase()] ?? currency ?? '$'
