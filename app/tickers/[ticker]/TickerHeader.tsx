'use client'
import Link from 'next/link'
import FavouriteButton from '@/app/components/FavouriteButton'
import { Company } from '@/app/CompanyList'

interface TickerHeaderProps {
  ticker: string
  company: Company | null
  exchange?: string
}

export default function TickerHeader({ ticker, company, exchange }: TickerHeaderProps) {
  return (
    <div className="flex items-start justify-between p-4 pb-0">
      <Link href={`/tickers/${ticker}`} className="flex items-center gap-4 flex-1">
        {company?.logo_url && (
          <img
            src={company.logo_url}
            alt={`${ticker} logo`}
            className="w-12 h-12 object-contain rounded-full"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{company?.name || ticker.toUpperCase()}</h1>
          <h2 className="text-gray-600 dark:text-gray-400">
            {ticker.toUpperCase()}
            {exchange && ` - ${exchange}`}
          </h2>
        </div>
      </Link>
      {company && (
        <div className="ml-4">
          <FavouriteButton company={company} />
        </div>
      )}
    </div>
  )
}
