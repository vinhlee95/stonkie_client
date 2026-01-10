import type { Metadata, Viewport } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { Suspense } from 'react'
import BottomNavigation from './components/BottomNavigation'
import { GeistSans } from 'geist/font/sans'

export const metadata: Metadata = {
  title: 'Stonkie 🚀',
  description: 'Invest in less is more',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Stonkie',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon-192x192.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={GeistSans.className}>
      <head>
        <meta name="application-name" content="Stonkie" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Stonkie" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="pb-16">
        <div className="px-1 md:px-8">
          {children}
          <SpeedInsights />
        </div>
        <Suspense>
          <BottomNavigation />
        </Suspense>
      </body>
    </html>
  )
}
