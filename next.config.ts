import type { NextConfig } from 'next'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  register: false, // We'll register manually to handle update prompts
  skipWaiting: false, // Wait for user confirmation before activating new SW
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
})

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

module.exports = withPWA(nextConfig)
