import { ETFFundamental } from '@/types/etf'

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
const REQUEST_TIMEOUT_MS = 5000

/**
 * Fetches ETF fundamental data by ticker symbol from the backend API.
 *
 * @param ticker - ETF ticker symbol (case-insensitive, backend normalizes to uppercase)
 * @returns Promise resolving to ETF fundamental data
 * @throws Error if ETF not found (404), network error, timeout, or invalid JSON response
 *
 * @example
 * ```ts
 * try {
 *   const etf = await getETFByTicker('SXR8');
 *   console.log(etf.name);
 * } catch (error) {
 *   console.error('Failed to fetch ETF:', error);
 * }
 * ```
 */
export async function getETFByTicker(ticker: string): Promise<ETFFundamental> {
  if (!ticker || ticker.trim().length === 0) {
    throw new Error('Ticker symbol is required')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${BACKEND_URL}/api/etf/${ticker}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    clearTimeout(timeoutId)

    if (response.status === 404) {
      throw new Error('ETF not found')
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch ETF: ${response.status} ${response.statusText}`)
    }

    try {
      const data = await response.json()
      return data as ETFFundamental
    } catch {
      throw new Error('Invalid JSON response from server')
    }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      // Re-throw if it's already our custom error
      if (error.message === 'ETF not found' || error.message.includes('Invalid JSON')) {
        throw error
      }
      // Network or other fetch errors
      throw new Error(`Network error: ${error.message}`)
    }

    throw new Error('Unknown error occurred while fetching ETF')
  }
}
