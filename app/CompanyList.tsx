'use client'
import Link from 'next/link'
import { useState, ReactNode } from 'react'
import FavouriteButton from './components/FavouriteButton'

export interface Company {
  name: string
  ticker: string
  logo_url: string
  sector: string
}

export default function CompanyList({
  companies,
  children,
}: {
  companies: Company[]
  children?: ReactNode
}) {
  const [loadingCompanyName, setLoadingCompanyName] = useState<string | null>(null)

  return (
    <>
      {children}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {companies.map((company) => (
          <div
            key={company.ticker}
            className={`bg-[var(--button-background)] dark:bg-[var(--button-background-dark)] rounded-xl flex items-center relative overflow-hidden ${loadingCompanyName && loadingCompanyName !== company.ticker ? 'opacity-40' : ''}`}
          >
            {loadingCompanyName === company.ticker && (
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/90 via-blue-50/30 to-transparent shadow-sm" />
            )}
            <Link
              href={`/tickers/${company.ticker}`}
              className="flex-1 flex items-center p-4 hover:bg-[var(--button-hover)] dark:hover:bg-[var(--button-hover-dark)] transition-colors duration-200 cursor-pointer rounded-l-xl"
              onClick={() => setLoadingCompanyName(company.ticker)}
            >
              {company.logo_url && (
                <div className="w-12 h-12 mr-4 flex-shrink-0 relative z-10">
                  <img
                    src={company.logo_url || '/placeholder.svg'}
                    alt={`${company.name} logo`}
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              )}
              <div className="relative z-10">
                <h3
                  className="text-gray-800 dark:text-white text-lg font-medium"
                  title={company.name}
                >
                  <span className="md:hidden">{company.name}</span>
                  <span className="hidden md:inline">
                    {company.name.length > 12
                      ? `${company.name.substring(0, 12)}...`
                      : company.name}
                  </span>
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{company.ticker}</p>
              </div>
            </Link>
            <div className="w-16 border-l border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <FavouriteButton company={company} />
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
