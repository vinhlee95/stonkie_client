'use client'

import { useRef, useState } from 'react'
import CompanyList, { Company } from '@/app/CompanyList'

const MOBILE_LIMIT = 5

interface SectorSectionProps {
  companies: Company[]
}

export default function SectorSection({ companies }: SectorSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const hasMore = companies.length > MOBILE_LIMIT
  const visibleCompanies = expanded ? companies : companies.slice(0, MOBILE_LIMIT)

  return (
    <div ref={sectionRef}>
      {/* Mobile: show limited list with expand/collapse */}
      <div className="sm:hidden">
        <div className="relative">
          <CompanyList companies={visibleCompanies} />
          {hasMore && !expanded && (
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
          )}
        </div>
        {hasMore && (
          <button
            type="button"
            onClick={() => {
              if (expanded) {
                // Collapsing — scroll to last visible card after state update
                requestAnimationFrame(() => {
                  const grid = sectionRef.current?.querySelector('.grid')
                  const lastCard = grid?.children[MOBILE_LIMIT - 1] as HTMLElement | undefined
                  lastCard?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                })
              }
              setExpanded((prev) => !prev)
            }}
            className="w-full mt-2 py-3 text-sm font-medium text-[var(--accent-active)] hover:underline cursor-pointer"
          >
            {expanded ? 'Show less' : `Show all ${companies.length} companies`}
          </button>
        )}
      </div>

      {/* Desktop: show all */}
      <div className="hidden sm:block">
        <CompanyList companies={companies} />
      </div>
    </div>
  )
}
