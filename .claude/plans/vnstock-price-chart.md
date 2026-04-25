# Self-Hosted Price Chart for VN Tickers (vnstock + Chart.js)

## Context

TradingView's free embed widget gates chart data for Vietnamese exchanges (HOSE/HNX/UPCOM) — shows "This symbol is only available on TradingView". Current fix in [PriceChart.tsx](../../app/tickers/[ticker]/PriceChart.tsx) is a link-out card ("View chart on TradingView →") for HOSE symbols.

This plan replaces the link-out with an inline price chart sourced from our own backend, starting with VN tickers. Chosen path: **vnstock** (Python library, MIT, free) on the backend; **Chart.js** (already installed at `chart.js@^4.4.9`, `react-chartjs-2@^5.3.0`) on the frontend. No new frontend deps.

Scope: VN tickers only for now. US/HE continue using the TradingView embed. Future: if desired, extend the same endpoint to all tickers using yfinance for non-VN.

## Backend

**Files:**

- `backend/requirements.txt` — add `vnstock`.
- `backend/main.py` or a new `backend/routers/prices.py` — expose endpoint.
- `backend/services/price_service.py` (new) — fetch + normalize OHLC.
- `backend/tests/test_prices.py` (new) — smoke test with mocked `vnstock`.

**Endpoint:** `GET /api/companies/{ticker}/prices?range=1y`

- `ticker`: same format as other endpoints (e.g. `FPT.VN`).
- `range`: `1m` | `3m` | `6m` | `1y` | `5y` | `all`. Default `1y`.
- Response:
  ```json
  {
    "ticker": "FPT.VN",
    "currency": "VND",
    "points": [
      { "t": "2024-04-22", "o": 120000, "h": 122000, "l": 119500, "c": 121500, "v": 2345678 }
    ]
  }
  ```
- For `.VN` tickers: use `vnstock.Quote(symbol='FPT', source='VCI').history(...)`.
- For others: fall back to existing yfinance code path (or 404 initially if not yet implemented).
- Cache: FastAPI response with `Cache-Control: public, max-age=300`; consider in-memory LRU for burst traffic.

**Library notes:**

- `vnstock` API surface: `from vnstock import Quote; Quote(symbol='FPT', source='VCI').history(start='2024-01-01', end='2025-01-01', interval='1D')` returns a pandas DataFrame with columns `time, open, high, low, close, volume`.
- Strip the `.VN` suffix before passing to `vnstock`.
- `source`: prefer `'VCI'` (Vietcap); fallbacks `'TCBS'`, `'MSN'`.

## Frontend

**Files:**

- `frontend-ssr/app/tickers/[ticker]/PriceChart.tsx` — branch: restricted → render new `<VnPriceChart>`; else → keep embed.
- `frontend-ssr/app/tickers/[ticker]/VnPriceChart.tsx` (new) — Chart.js line chart.
- Reuse `useDarkMode` at [app/components/hooks/useDarkMode](../../app/components/hooks/useDarkMode.ts) for theming.
- Reuse fetch/data patterns from existing [FinancialChart.tsx](../../app/components/FinancialChart.tsx) (Chart.js already configured there).

**Component sketch:**

- React Query (`useQuery`) to `/api/companies/${ticker}/prices?range=1y` (Client Component).
- Range selector: `1m | 3m | 6m | 1y | 5y | all` — matches current embed's date-ranges.
- Chart.js line (or candlestick via `chartjs-chart-financial` — adds a dep; defer).
- Match existing container size: `h-[250px] mb-6`.
- Skeleton/loader for initial fetch.
- Error state: fall back to current link-out card.

## Shared Conventions

- Per root `CLAUDE.md`, API path is `/api/companies/{ticker}/prices` with `ticker` param.
- Server Components use `fetch()` with revalidation; Client Components use React Query. PriceChart is Client — React Query.
- E2E tests use mock backend — add `/api/companies/:ticker/prices` to `tests/e2e/mock-backend` (check existing mock structure).

## Verification

- `source venv/bin/activate && pytest backend/tests/test_prices.py -v`
- `cd frontend-ssr && npm run type-check && npm run test:unit && npm run e2e`
- Preview manual check:
  - `/tickers/FPT.VN` — inline chart with VND prices.
  - `/tickers/AAPL`, `/tickers/NOKIA.HE` — unchanged TradingView embed.
- Hit endpoint directly: `curl localhost:8080/api/companies/FPT.VN/prices?range=1y | jq '.points | length'`.

## Risks / Open Questions

- **Upstream stability:** `vnstock` scrapes VCI/TCBS; endpoint shape can break. Wrap in retry + source-fallback.
- **Rate limits:** unclear on VCI free endpoint. Cache aggressively.
- **Candles vs line chart:** line (close only) is simpler and matches the current area-style embed. Candlestick requires `chartjs-chart-financial` + `luxon`.
- **Currency formatting:** VND values are large (e.g. 120,000 ₫). Reuse the `₫`/`T`/`B` formatter seen in [page.tsx](../../app/tickers/[ticker]/page.tsx) key-stats section.
- **Extending to US/HE:** out of scope for this plan. Once `/prices` works for VN, a follow-up can swap the embed for a uniform self-hosted chart everywhere.
