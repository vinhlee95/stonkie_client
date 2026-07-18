/**
 * CDN/browser cache for aggregated recap JSON; upstream uses no-store on cache miss.
 *
 * Do not raise past ~5h: recap payloads carry a signed audio URL that expires 6h
 * after the backend minted it, so a longer TTL would serve dead URLs from the CDN.
 */
export const MARKETS_RECAPS_ROUTE_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=59'
