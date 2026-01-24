'use client'
import { useState } from 'react'
import CompanyList, { Company } from '@/app/CompanyList'
import SectorFilter from './SectorFilter'

export default function MostViewedCompanies({ companies }: { companies: Company[] }) {
  const [selectedSector, setSelectedSector] = useState<string>('All Sectors')

  // Extract unique sectors
  const sectors = [
    'All Sectors',
    ...Array.from(new Set(companies.map((c) => c.sector).filter(Boolean))),
  ]

  // Filter companies based on selected sector
  const filteredCompanies =
    selectedSector === 'All Sectors'
      ? companies
      : companies.filter((c) => c.sector === selectedSector)

  return (
    <CompanyList companies={filteredCompanies}>
      <SectorFilter
        sectors={sectors}
        selectedSector={selectedSector}
        onSelectSector={setSelectedSector}
      />
    </CompanyList>
  )
}
