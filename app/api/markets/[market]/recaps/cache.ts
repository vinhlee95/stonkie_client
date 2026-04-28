/** CDN/browser cache for aggregated recap JSON; upstream uses no-store on cache miss. */
export const MARKETS_RECAPS_ROUTE_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=59'
