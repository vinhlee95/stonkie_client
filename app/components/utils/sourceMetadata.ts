export interface SourceMetadata {
  url?: string
  title?: string
  publisher?: string
  publishedAt?: string | null
}

const KNOWN_BRANDS: Record<string, string> = {
  'reuters.com': 'Reuters',
  'marketwatch.com': 'MarketWatch',
  'cnbc.com': 'CNBC',
  'bloomberg.com': 'Bloomberg',
  'wsj.com': 'WSJ',
  'ft.com': 'FT',
}

export function normalizeSourceSiteLabel(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return 'Source'

  let normalized = trimmed
  if (!normalized.includes('://') && normalized.includes('.')) {
    normalized = `https://${normalized}`
  }

  try {
    const host = new URL(normalized).hostname.replace(/^www\./, '').toLowerCase()
    if (KNOWN_BRANDS[host]) return KNOWN_BRANDS[host]
    const [root] = host.split('.')
    if (!root) return 'Source'
    return root.charAt(0).toUpperCase() + root.slice(1)
  } catch {
    const lowercase = normalized.toLowerCase()
    for (const [domain, brand] of Object.entries(KNOWN_BRANDS)) {
      if (lowercase.includes(domain)) return brand
    }
    return normalized
  }
}

export function getSourcePublisherLabel(source: SourceMetadata): string {
  const publisher = source.publisher?.trim()
  if (publisher) return normalizeSourceSiteLabel(publisher)
  if (source.url) return normalizeSourceSiteLabel(source.url)
  return 'Source'
}

export function getSourceDisplayLabel(source: SourceMetadata): string {
  const publisher = source.publisher?.trim()
  if (publisher) return normalizeSourceSiteLabel(publisher)
  if (source.url) return normalizeSourceSiteLabel(source.url)

  const title = source.title?.trim()
  if (title) return title

  return 'Source'
}
