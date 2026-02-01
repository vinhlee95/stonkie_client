'use client'
import Link from 'next/link'
import { useState, ReactNode } from 'react'
import { Wallet } from 'lucide-react'
import ETFFavouriteButton from './ETFFavouriteButton'

export interface ETFListItem {
  ticker: string
  name: string
  fund_provider: string
  logo_url?: string
}

export default function ETFList({ etfs, children }: { etfs: ETFListItem[]; children?: ReactNode }) {
  const [loadingTicker, setLoadingTicker] = useState<string | null>(null)

  return (
    <>
      {children}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {etfs.map((etf) => (
          <div
            key={etf.ticker}
            className={`bg-[var(--button-background)] dark:bg-[var(--button-background-dark)] rounded-xl flex items-center relative overflow-hidden ${loadingTicker && loadingTicker !== etf.ticker ? 'opacity-40' : ''}`}
          >
            {loadingTicker === etf.ticker && (
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/90 via-blue-50/30 to-transparent shadow-sm" />
            )}
            <Link
              href={`/etf/${etf.ticker}`}
              className="flex-1 flex items-center p-4 hover:bg-[var(--button-hover)] dark:hover:bg-[var(--button-hover-dark)] transition-colors duration-200 cursor-pointer rounded-l-xl"
              onClick={() => setLoadingTicker(etf.ticker)}
            >
              <div className="w-12 h-12 mr-4 flex-shrink-0 relative z-10">
                {etf.logo_url ? (
                  <img
                    src={etf.logo_url}
                    alt={`${etf.name} logo`}
                    className="w-full h-full object-contain rounded-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full">
                    <Wallet className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
              </div>
              <div className="relative z-10 flex-1">
                <h3 className="text-gray-800 dark:text-white text-lg font-medium" title={etf.name}>
                  <span className="md:hidden">{etf.name}</span>
                  <span className="hidden md:inline">
                    {etf.name.length > 12 ? `${etf.name.substring(0, 12)}...` : etf.name}
                  </span>
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{etf.ticker}</p>
                {etf.fund_provider && (
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                    {etf.fund_provider}
                  </p>
                )}
              </div>
            </Link>
            <div className="w-16 border-l border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <ETFFavouriteButton etf={etf} />
            </div>
          </div>
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
