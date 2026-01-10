import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    domains: ['images.unsplash.com'],
  },
  // Only configure caching on root route here. Caching for individual routes are configured by "revalidate" constant in their corresponding pages
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=59',
          },
        ],
      },
    ]
  },
}

// Only apply PWA wrapper in production builds to avoid Webpack/Turbopack conflicts
// PWA is disabled in development anyway, so this wrapper isn't needed during dev
if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withPWA = require('next-pwa')({
    dest: 'public',
    register: false, // We'll register manually to handle update prompts
    skipWaiting: false, // Wait for user confirmation before activating new SW
    disable: false,
    buildExcludes: [/middleware-manifest\.json$/],
  })
  module.exports = withPWA(nextConfig)
} else {
  module.exports = nextConfig
}
