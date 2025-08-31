'use client'
import { useState } from 'react'

type CompanyInfoType = {
  name: string
  sector: string
  industry: string
  description?: string
  country: string
}

function toTitleCase(str?: string) {
  if (!str) return ''
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}
export default function CompanyInfo({ companyInfo }: { companyInfo: CompanyInfoType }) {
  const [showMore, setShowMore] = useState(false)
  const maxLength = 200
  const toggleShowMore = () => setShowMore((prev) => !prev)
  const des = companyInfo?.description?.trim() ?? ''
  const needsTruncate = des.length > maxLength
  const displayed = showMore ? des + ' ' : des.slice(0, maxLength) + (needsTruncate ? '... ' : '')

  return (
    <section className="mt-2 mb-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 text-lg mb-2">
        <div>
          <span className="font-semibold">Sector: </span>
          <span>{toTitleCase(companyInfo.sector)}</span>
        </div>
        <div>
          <span className="font-semibold">Industry: </span>
          <span>{toTitleCase(companyInfo.industry)}</span>
        </div>
        <div>
          <span className="font-semibold">Country: </span>
          <span>{companyInfo.country}</span>
        </div>
      </div>

      <p className="text-lg leading-relaxed">
        {displayed}
        {needsTruncate && (
          <button
            onClick={toggleShowMore}
            className="text-blue-300 hover:underline focus:outline-none"
            aria-expanded={showMore}
            aria-label={showMore ? 'Show Less' : 'Show More'}
          >
            {showMore ? 'Show Less' : 'Show More'}
          </button>
        )}
      </p>
    </section>
  )
}
