'use client'
import Link from 'next/link'
import { useState, ReactNode } from 'react'

export interface ETFListItem {
  ticker: string
  name: string
  fund_provider: string
}

export default function ETFList({ etfs, children }: { etfs: ETFListItem[]; children?: ReactNode }) {
  const [loadingTicker, setLoadingTicker] = useState<string | null>(null)

  return (
    <>
      {children}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {etfs.map((etf) => (
          <Link
            key={etf.ticker}
            href={`/etf/${etf.ticker}`}
            className={`bg-[var(--button-background)] hover:bg-[var(--button-hover)] dark:bg-[var(--button-background-dark)] dark:hover:bg-[var(--button-hover-dark)] transition-colors duration-200 rounded-xl p-4 flex items-center cursor-pointer relative overflow-hidden ${loadingTicker && loadingTicker !== etf.ticker ? 'opacity-40' : ''}`}
            onClick={() => setLoadingTicker(etf.ticker)}
          >
            {loadingTicker === etf.ticker && (
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/90 via-blue-50/30 to-transparent shadow-sm" />
            )}
            <div className="relative z-10 flex-1">
              <h3 className="text-gray-800 dark:text-white text-lg font-medium" title={etf.name}>
                <span className="md:hidden">{etf.name}</span>
                <span className="hidden md:inline">
                  {etf.name.length > 12 ? `${etf.name.substring(0, 12)}...` : etf.name}
                </span>
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{etf.ticker}</p>
              {etf.fund_provider && (
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">{etf.fund_provider}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Add the keyframes definition */}
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </>
  )
}
