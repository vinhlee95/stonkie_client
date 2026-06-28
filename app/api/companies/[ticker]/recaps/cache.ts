/**
 * CDN/browser cache for per-ticker recap JSON; upstream uses no-store on cache miss.
 * Recaps are precomputed once per trading day, so a long edge TTL is safe: cache 10 min,
 * then serve stale up to an hour while revalidating in the background.
 */
export const COMPANIES_RECAPS_ROUTE_CACHE_CONTROL =
  'public, s-maxage=600, stale-while-revalidate=3600'
