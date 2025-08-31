'use client'
import { useState, useEffect } from 'react'

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
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const maxLength = isDesktop ? 400 : 200
  const toggleShowMore = () => setShowMore((prev) => !prev)
  const des = companyInfo?.description?.trim() ?? ''
  const needsTruncate = des.length > maxLength
  const displayed = showMore ? des + ' ' : des.slice(0, maxLength) + (needsTruncate ? '... ' : '')

  return (
    <section className="mb-4">
      <h3 className="mb-2">
        {toTitleCase(companyInfo.sector)} | {toTitleCase(companyInfo.industry)} |{' '}
        {toTitleCase(companyInfo.country).toUpperCase()}
      </h3>
      <p className="leading-relaxed">
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
