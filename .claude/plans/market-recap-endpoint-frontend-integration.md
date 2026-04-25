# Market Recap Endpoint Frontend Integration Plan

## Goal

Integrate backend recap API into frontend so market recap content renders reliably with citation mapping.

Endpoint:

- `GET /api/markets/{market}/recaps?cadence=weekly&limit=N`
- Example: `/api/markets/US/recaps?cadence=weekly&limit=1`

Base URL convention in this repo:

- Server components: `process.env.BACKEND_URL`
- Client components/services: `process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"`

## API Contract (Current Backend Behavior)

Response shape:

```json
{
  "market": "US",
  "cadence": "weekly",
  "latest_created_at": "2026-04-25T13:18:03.721444Z",
  "items": [
    {
      "period_start": "2026-04-20",
      "period_end": "2026-04-24",
      "created_at": "2026-04-25T13:18:03.721444Z",
      "summary": "string",
      "bullets": [
        {
          "text": "string",
          "citations": [{ "source_id": "string" }]
        }
      ],
      "sources": [
        {
          "id": "string",
          "url": "string",
          "title": "string",
          "publisher": "string",
          "published_at": "ISO-8601",
          "fetched_at": "ISO-8601"
        }
      ]
    }
  ]
}
```

Semantics:

- `market` is normalized uppercase by backend.
- Results sorted by `period_start` descending.
- `limit` range is backend-validated (`1..52`).
- Empty state is success: `200` with `items: []` and `latest_created_at: null`.
- `raw_sources` is intentionally excluded from public payload.
- Citation mapping contract: every `bullets[].citations[].source_id` should map to `sources[].id`.

## Frontend Data Types

Use strict types in frontend API layer.

```ts
export type RecapCitation = { source_id: string }
export type RecapBullet = { text: string; citations: RecapCitation[] }
export type RecapSource = {
  id: string
  url: string
  title: string
  publisher: string
  published_at: string
  fetched_at: string
}
export type MarketRecapItem = {
  period_start: string
  period_end: string
  created_at: string
  summary: string
  bullets: RecapBullet[]
  sources: RecapSource[]
}
export type MarketRecapResponse = {
  market: string
  cadence: string
  latest_created_at: string | null
  items: MarketRecapItem[]
}
```

## Integration Steps

1. Create frontend API client function
   - Suggested file: `frontend-ssr/lib/api/marketRecap.ts`
   - Function: `getMarketRecaps({ market = "US", cadence = "weekly", limit = 1 })`
   - URL: `${BACKEND_URL}/api/markets/${market}/recaps?cadence=${cadence}&limit=${limit}`
   - Validate `response.ok`, throw with status/body on non-2xx.
   - Parse + return typed `MarketRecapResponse`.

2. Add server-side fetch at page boundary
   - Preferred for SEO/stability: Server Component page fetch.
   - Use Next fetch caching strategy appropriate for weekly data:
     - `next: { revalidate: 3600 }` (or longer, e.g. 6h).

3. Add rendering adapter for citation linking
   - Build `sourceById = new Map(item.sources.map(s => [s.id, s]))`.
   - For each bullet citation:
     - Resolve via `source_id`.
     - Render source title + publisher + outbound link.
   - If unresolved source id (defensive fallback):
     - Hide broken citation chip or render "Source unavailable".

4. Implement UX states
   - Loading: skeleton/placeholder.
   - Empty (`items.length === 0`): "No weekly recap available yet."
   - Error: non-blocking fallback card with retry affordance.
   - Freshness: show `latest_created_at` in user timezone.

5. Add tests
   - Unit test for API parser/type guard (or runtime schema parse if used).
   - Component test:
     - renders summary + bullets.
     - citation chip links resolve via `source_id -> sources.id`.
     - empty state renders for `items: []`.
   - If using mocked backend in E2E setup, add `/api/markets/US/recaps` handler.

## Rendering Rules (Important)

- Never assume array order between `bullets.citations` and `sources`; always join by id.
- Do not expose or expect `raw_sources`.
- Handle timestamp strings as UTC ISO; format client-side only for display.
- Treat `items[0]` as latest recap for default `limit=1`.

## Suggested File Changes (Frontend)

- Add: `frontend-ssr/lib/api/marketRecap.ts`
- Add/update: market recap page/component (project-specific target)
- Add tests near component or in existing test directories.

## Verification Checklist

- `curl` returns `200` and expected payload.
- Frontend displays latest recap summary, bullets, and source links.
- Citation chips correctly resolve to top-level `sources`.
- Empty response renders proper empty-state copy.
- No UI dependency on hidden/internal fields.

## Risks / Notes

- Backend validates `limit` and defaults cadence to `weekly`; frontend should still send explicit params for clarity.
- If backend adds fields later, keep frontend parser forwards-compatible (ignore unknown keys).
- If multiple markets are introduced in UI, normalize market input to uppercase before request.
