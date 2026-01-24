'use client'
import { useState } from 'react'
import CompanyList, { Company } from '@/app/CompanyList'
import IndustryFilter from './IndustryFilter'

export default function MostViewedCompanies({ companies }: { companies: Company[] }) {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All Industries')

  // Extract unique industries
  const industries = [
    'All Industries',
    ...Array.from(new Set(companies.map((c) => c.industry).filter(Boolean))),
  ]

  // Filter companies based on selected industry
  const filteredCompanies =
    selectedIndustry === 'All Industries'
      ? companies
      : companies.filter((c) => c.industry === selectedIndustry)

  return (
    <CompanyList companies={filteredCompanies}>
      <IndustryFilter
        industries={industries}
        selectedIndustry={selectedIndustry}
        onSelectIndustry={setSelectedIndustry}
      />
    </CompanyList>
  )
}
