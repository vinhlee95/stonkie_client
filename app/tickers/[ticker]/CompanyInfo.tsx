'use client'
import { KeyStatsType } from './KeyStats'
import { useState } from 'react'

type CompanyInfoType = Pick<
  KeyStatsType,
  'name' | 'sector' | 'industry' | 'country' | 'description'
>
function toTitleCase(str: string) {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function CompanyInfo({ companyInfo }: { companyInfo: CompanyInfoType }) {
  const [showMore, setShowMore] = useState(false)
  const maxLength = 200
  const toggleShowMore = () => setShowMore((prev) => !prev)
  const needsTruncate = companyInfo.description.length > maxLength
  const displayed = showMore
    ? companyInfo.description
    : companyInfo.description.slice(0, maxLength) + (needsTruncate ? '...' : '')
  return (
    <section className="mt-2 mb-6">
      <h2 className="text-xl font-bold mb-2">About {companyInfo.name}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-lg mb-2">
        <div>
          <span className="font-semibold">Sector:</span>{' '}
          <span>{toTitleCase(companyInfo.sector)}</span>
        </div>
        <div>
          <span className="font-semibold">Industry:</span>{' '}
          <span>{toTitleCase(companyInfo.industry)}</span>
        </div>
        <div>
          <span className="font-semibold">Country:</span> <span>{companyInfo.country}</span>
        </div>
      </div>
      <p className="text-lg leading-relaxed">
        {displayed}
        {needsTruncate && (
          <button
            onClick={toggleShowMore}
            className="text-blue-300 hover:underline focus:outline-none"
            aria-expanded={showMore}
          >
            {showMore ? 'Show Less' : 'Show More'}
          </button>
        )}
      </p>
    </section>
  )
}
