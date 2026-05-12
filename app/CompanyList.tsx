'use client'
import Link from 'next/link'
import { useState, ReactNode } from 'react'
import FavouriteButton from './components/FavouriteButton'

export interface Company {
  name: string
  ticker: string
  logo_url: string
  sector: string
  country: string
  exchange: string
}

function LogoFallback({ name }: { name: string }) {
  const initials = name
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
      style={{ background: 'linear-gradient(135deg, #286956, #4ea88a)' }}
    >
      {initials}
    </div>
  )
}

function CompanyLogo({ url, name }: { url?: string; name: string }) {
  const [err, setErr] = useState(false)
  if (err || !url) return <LogoFallback name={name} />
  return (
    <img
      src={url}
      alt={name}
      onError={() => setErr(true)}
      className="w-10 h-10 rounded-full object-contain bg-white border border-black/6 dark:border-white/10"
    />
  )
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {companies.map((company) => (
          <div
            key={company.ticker}
            className={`bg-white dark:bg-[var(--card-background)] border border-[var(--accent-active-border)] dark:border-gray-700 rounded-2xl flex items-center relative overflow-hidden transition-transform duration-150 hover:-translate-y-0.5 ${loadingCompanyName && loadingCompanyName !== company.ticker ? 'opacity-40' : ''}`}
          >
            {loadingCompanyName === company.ticker && (
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/90 via-blue-50/30 to-transparent shadow-sm" />
            )}
            <Link
              href={`/tickers/${company.ticker}`}
              className="flex-1 flex items-center p-4 cursor-pointer rounded-l-2xl"
              onClick={() => setLoadingCompanyName(company.ticker)}
            >
              <div className="mr-3 flex-shrink-0 relative z-10">
                <CompanyLogo url={company.logo_url} name={company.name} />
              </div>
              <div className="relative z-10 min-w-0">
                <div className="text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                  {company.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-base text-gray-500 dark:text-gray-400 font-semibold">
                    {company.ticker}
                  </span>
                  {company.exchange && (
                    <span className="text-[9px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-px rounded tracking-wide">
                      {company.exchange}
                    </span>
                  )}
                </div>
              </div>
            </Link>
            <div className="pr-2 flex items-center justify-center">
              <FavouriteButton company={company} />
            </div>
          </div>
        ))}
      </div>

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
