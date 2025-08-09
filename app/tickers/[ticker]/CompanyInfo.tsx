'use client'
import { useState } from 'react'

export type CompanyInfoType = {
  name: string
  sector: string
  industry: string
  description: string
  country: string
}

export default function CompanyInfo({ companyInfo }: { companyInfo: CompanyInfoType }) {
  const [showMore, setShowMore] = useState(false)
  const maxLength = 200
  const toggleShowMore = () => setShowMore((prev) => !prev)
  const shortcut = companyInfo.description.length > maxLength
  const displayed = showMore
    ? companyInfo.description
    : companyInfo.description.slice(0, maxLength) + (shortcut ? '...' : '')
  return (
    <section className="m-4">
      <h2 className="text-xl font-bold mb-4">About {companyInfo.name}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-lg">
        <div>
          <span className="font-semibold">Sector:</span> <span>{companyInfo.sector}</span>
        </div>
        <div>
          <span className="font-semibold">Industry:</span> <span>{companyInfo.industry}</span>
        </div>
        <div>
          <span className="font-semibold">Country:</span> <span>{companyInfo.country}</span>
        </div>
      </div>
      <p className="mt-5 text-lg leading-relaxed">
        {displayed}
        {shortcut && (
          <button
            onClick={toggleShowMore}
            className="ml-2 text-blue-500 hover:underline focus:outline-none"
            aria-expanded={showMore}
            aria-label={showMore ? 'Show less' : 'Show more'}
            type="button"
          >
            {showMore ? 'Show less' : 'Show more'}
          </button>
        )}
      </p>
    </section>
  )
}
