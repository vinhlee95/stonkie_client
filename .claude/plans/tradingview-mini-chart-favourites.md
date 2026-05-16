# TradingView Mini Chart in Favourite Cards

## Context

Favourite cards on Home show logo/name/ticker/star but no live price data. The card component has props for `price`, `change`, `sparkData` etc. but they're never passed — no data source is wired up. Instead of building a data pipeline, embed TradingView's **Mini Symbol Overview** widget which provides price, daily change, and area chart out of the box.

## Plan

### 1. Extract shared TradingView utils

**Create** `app/lib/tradingview.ts`

Move from `app/tickers/[ticker]/PriceChart.tsx`:

- `EXCHANGE_MAP`, `RESTRICTED_EXCHANGES`
- `toTradingViewSymbol()`, `isRestricted()`

Update `PriceChart.tsx` to import from the new module.

### 2. Create `TradingViewMiniChart` component

**Create** `app/components/TradingViewMiniChart.tsx`

- Script: `embed-widget-mini-symbol-overview.js`
- Props: `ticker`, `height?` (default 120), `largeChartUrl?`
- Uses `toTradingViewSymbol()` for symbol mapping
- Dark mode via `useDarkMode()` — recreates widget on toggle (same pattern as PriceChart)
- `isTransparent: true` to blend with card bg
- Colors: `trendLineColor: "#286956"` matching `--tab-active`
- Restricted exchanges: render compact "View on TradingView" link
- **Lazy loading**: `IntersectionObserver` with `rootMargin: '100px'` — only inject script when card is near viewport. Shimmer placeholder before load.
- Wrapped in `React.memo`

### 3. Integrate into `FavouriteCard.tsx`

- **Remove** `Sparkline` component (lines 97-138) — never used (no data passed)
- **Remove** dead props: `price`, `change`, `changePct`, `dir`, `sparkData`
- **Keep** `earningsInDays`, `headline` (orthogonal features)
- **Remove** `useId` import (only used by deleted Sparkline)
- **Grid variant**: replace price+sparkline block with `TradingViewMiniChart` in a 120px-tall container
- **Rail variant**: replace price panel with `TradingViewMiniChart` in a 100px-tall container
- **Click handling**: transparent overlay `div` (absolute, inset-0, z-1) over widget area so parent `<Link>` captures clicks instead of iframe

### 4. Update `FavouritesList.tsx`

- Update skeleton heights to match new card size (~h-44 desktop, ~180px mobile)

### 5. Files summary

| Action | File                                      |
| ------ | ----------------------------------------- |
| Create | `app/lib/tradingview.ts`                  |
| Create | `app/components/TradingViewMiniChart.tsx` |
| Modify | `app/components/FavouriteCard.tsx`        |
| Modify | `app/components/FavouritesList.tsx`       |
| Modify | `app/tickers/[ticker]/PriceChart.tsx`     |

### 6. Verification

- `npm run type-check`
- Dev server: check Home page with 2+ favourites, verify widgets load, click-through works, dark mode toggle recreates widgets
- Mobile rail: verify lazy loading (off-screen cards don't load until scrolled)
- Restricted exchange ticker: verify fallback link renders

## Risks

- **6 iframes on page** — mitigated by lazy loading + IntersectionObserver
- **ETF symbol resolution** — US ETFs (SPY, QQQ) work as plain tickers; non-US may need `EXCHANGE_MAP` entries
- **TradingView CDN failure** — card still shows name/ticker/logo; only chart area is blank

## Decisions

- **Date range**: `"1D"` (intraday) — shows today's price action
- **Widget header**: hidden — chart area only, no TradingView symbol/price text (card already has its own header). Use `chartOnly: true` or equivalent config option.
