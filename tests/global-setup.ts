import { createServer } from 'http'
import type { FullConfig } from '@playwright/test'

let server: ReturnType<typeof createServer> | null = null

export default async function globalSetup(_config: FullConfig) {
  // Start a mock backend server on port 8080 for tests
  server = createServer((req, res) => {
    // Set CORS headers for browser requests
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Content-Type', 'application/json')

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    // Mock most-viewed companies endpoint
    if (req.url === '/api/companies/most-viewed') {
      res.writeHead(200)
      res.end(JSON.stringify({ data: [{ ticker: 'AAPL', name: 'Apple Inc.' }] }))
      return
    }

    // Mock company key stats
    if (req.url?.match(/\/api\/companies\/.*\/key-stats/)) {
      res.writeHead(200)
      res.end(
        JSON.stringify({
          data: {
            ticker: 'AAPL',
            name: 'Apple Inc.',
            description: 'Test company',
            market_cap: 3000000000000,
            pe_ratio: 30,
            forward_pe: 28,
            peg_ratio: 2.5,
            dividend_yield: 0.5,
            beta: 1.2,
            week_52_high: 200,
            week_52_low: 150,
          },
        }),
      )
      return
    }

    // Mock company statements
    if (req.url?.match(/\/api\/companies\/.*\/statements/)) {
      res.writeHead(200)
      res.end(JSON.stringify([]))
      return
    }

    // Mock ETF endpoint
    if (req.url?.match(/\/api\/etf\/.+/)) {
      res.writeHead(200)
      res.end(
        JSON.stringify({
          isin: 'US12345678',
          ticker: 'SPYY',
          name: 'Test ETF',
          fund_provider: 'Test Provider',
          fund_size_billions: 10.5,
          ter_percent: 0.2,
          replication_method: 'Physical',
          distribution_policy: 'Accumulating',
          fund_currency: 'USD',
          domicile: 'United States',
          launch_date: '2020-01-01',
          index_tracked: 'S&P 500',
          holdings: [
            { name: 'Apple Inc.', weight_percent: 7.5 },
            { name: 'Microsoft Corp.', weight_percent: 6.8 },
          ],
          sector_allocation: [
            { sector: 'Technology', weight_percent: 30 },
            { sector: 'Healthcare', weight_percent: 15 },
          ],
          country_allocation: [{ country: 'United States', weight_percent: 100 }],
          source_url: null,
          created_at: null,
          updated_at: null,
        }),
      )
      return
    }

    // Mock ETF list endpoint
    if (req.url === '/api/etf') {
      res.writeHead(200)
      res.end(JSON.stringify([]))
      return
    }

    // Mock FAQ endpoint
    if (req.url?.match(/\/api\/company\/faq/)) {
      res.writeHead(200)
      res.end(JSON.stringify({ data: [] }))
      return
    }

    // Default 404
    res.writeHead(404)
    res.end(JSON.stringify({ error: 'Not found' }))
  })

  await new Promise<void>((resolve) => {
    server?.listen(8080, () => {
      console.log('Mock backend server started on http://localhost:8080')
      resolve()
    })
  })

  // Return teardown function
  return async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server?.close(() => {
          console.log('Mock backend server stopped')
          resolve()
        })
      })
    }
  }
}
