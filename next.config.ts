/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig
