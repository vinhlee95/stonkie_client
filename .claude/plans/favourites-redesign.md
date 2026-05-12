# Favourites Redesign

## Context

The current `FavouritesList` is a plain list that reuses `CompanyList` and `ETFList` — it doesn't match the new design language. The design (from Claude Design handoff) replaces it with richer cards that have slots for live price, sparkline, earnings countdown, and news headlines. Day-1 ships the layout shell only; slots hide gracefully when data is missing.

**Design decisions (from chat transcript):**

- Desktop (>=768px): 3-column snapshot grid (variant A)
- Mobile (<768px): horizontal scroll-snap rail (variant D)
- Favourites is cross-country — not filtered by market/country chips
- Section hidden when 0 favourites
- Header: "Favourites · N tracked" — no Manage action
- Page order: filters → sector strip → **Favourites** → chart → recap → sectors

## Files to modify

| File                                     | Change                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| `app/components/FavouritesList.tsx`      | Full rewrite — new section header + responsive grid/rail container       |
| `app/components/FavouriteCard.tsx`       | **New** — shared card component with 5 data slots                        |
| `app/components/MostViewedCompanies.tsx` | Import and render `FavouritesList` after sticky filter bar, before chart |
| `app/page.tsx`                           | Remove `FavouritesList` import/render (moved into MostViewedCompanies)   |
| `app/globals.css`                        | Add `--accent-down` token, scrollbar-hide utility, card accent styles    |

## Files NOT modified

- `app/components/hooks/useFavourites.ts` — reused as-is
- `app/components/FavouriteButton.tsx` — reused inside FavouriteCard
- `app/components/ETFFavouriteButton.tsx` — reused inside FavouriteCard for ETFs
- `app/CompanyList.tsx` — no longer used by FavouritesList (Company type still imported)
- `app/components/ETFList.tsx` — no longer used by FavouritesList (ETFListItem type still imported)

## Implementation steps

### 1. Add CSS tokens to `globals.css`

- Add `--accent-down: rgb(170, 60, 60)` and `--accent-down-soft: rgba(170, 60, 60, 0.08)` to `:root`
- Add dark mode variants
- Add `.no-scrollbar` utility (scrollbar-width: none + webkit hide)

### 2. Create `FavouriteCard.tsx`

New client component matching the design card anatomy:

**Card structure (variant A — grid):**

```
┌─────────────────────────────────────────────┐
│ [logo] Company Name                    [★]  │  header row
│        AAPL  NMS                            │
│                                             │
│ 228.46                        [sparkline]   │  price + spark (hidden if no data)
│ ▲ +1.84 (+0.81%)                            │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  dashed divider (hidden if no footer data)
│ 📅 6d  ·  News headline here...             │  slot row (hidden if no data)
└─────────────────────────────────────────────┘
```

**Props:**

```tsx
type FavouriteCardProps = {
  item: Company | ETFListItem
  variant?: 'grid' | 'rail'
  // Future data slots (all optional)
  price?: number
  change?: number
  changePct?: number
  dir?: 'up' | 'down'
  sparkData?: number[]
  earningsInDays?: number
  headline?: string
}
```

**Key details from design:**

- Border: `1px solid rgba(40,105,86,0.18)` (accent-active-border)
- 4px left accent stripe colored by direction (green up / red down) — only shown when price data exists
- Card lifts 2px on hover (`transform: translateY(-2px)`)
- Logo: 40px, falls back to gradient initial circle on error (reuse existing pattern from CompanyList)
- Ticker in mono font, exchange as small badge
- Star: reuse existing `FavouriteButton` / `ETFFavouriteButton` — detect type by checking for `fund_provider` field
- Price block: mono font, 22px weight 700, day change with ▲/▼ glyph, colored green/red
- Sparkline: inline SVG, 84×32, gradient fill + line, colored by 30d direction
- Footer: dashed border top, earnings pill + news headline ellipsed
- All slots below header gracefully hidden when data is absent
- Dark mode: use `dark:` variants for backgrounds, borders, text colors

**Mobile variant (rail):**

- Same content but price + sparkline sit inside a tinted panel (green/red at 4%)
- Earnings pill and news below the panel
- 260px fixed width, scroll-snap-align: start

### 3. Rewrite `FavouritesList.tsx`

```tsx
'use client'
// Combines company + ETF favourites
// Desktop: 3-column grid (md:grid-cols-3)
// Mobile: horizontal scroll-snap rail
```

**Section header:**

- Green dot (6px, with 4px shadow ring) + "Favourites" (22px bold) + "N tracked" pill (mono, green bg)
- No "Manage" action

**Container:**

- Desktop (>=768px): `grid grid-cols-2 md:grid-cols-3 gap-3.5`
- Mobile: `flex overflow-x-auto snap-x snap-mandatory gap-3 no-scrollbar` with 260px tiles

### 4. Move rendering into `MostViewedCompanies.tsx`

- Import `FavouritesList`
- Render it right after the sticky filter bar `</div>` and before `IndexSummaryStrip` / `MarketChart`
- Wrap in a `<div className="mb-4">` for spacing

### 5. Clean up `page.tsx`

- Remove `FavouritesList` import and `<FavouritesList />` JSX
- Keep `FavouritesSkeleton` concept — but it's now internal to FavouritesList

## Dark mode considerations

- Card bg: `bg-white dark:bg-[var(--card-background)]`
- Card border: adjust opacity for dark mode
- Text colors: `text-gray-900 dark:text-gray-100`, `text-gray-500 dark:text-gray-400`
- Accent stripe: same green/red works in both modes
- Sparkline: CSS variable colors work in both modes
- Section header dot: green accent works in both modes

## Verification

1. `npm run type-check` — no TS errors
2. `npm run dev` → check home page in browser
3. Add a few favourites → verify grid appears on desktop (3-col at >=768px)
4. Resize to mobile → verify horizontal rail with 260px tiles, no scrollbar
5. Remove all favourites → section disappears
6. Toggle dark mode → cards render correctly
7. Click star on card → removes favourite in place
8. Cards with no price/spark/earnings/news data → show only logo + name + ticker + star (graceful degradation)

## Unresolved questions

- None — all decisions confirmed by user and design handoff.
