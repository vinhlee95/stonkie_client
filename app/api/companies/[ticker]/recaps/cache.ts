/**
 * CDN/browser cache for per-ticker recap JSON; upstream uses no-store on cache miss.
 * Recaps are precomputed once per trading day, so a long edge TTL is safe: cache 10 min,
 * then serve stale up to an hour while revalidating in the background.
 *
 * Do not raise past ~5h: recap payloads carry a signed audio URL that expires 6h
 * after the backend minted it, so a longer TTL would serve dead URLs from the CDN.
 */
export const COMPANIES_RECAPS_ROUTE_CACHE_CONTROL =
  'public, s-maxage=600, stale-while-revalidate=3600'
