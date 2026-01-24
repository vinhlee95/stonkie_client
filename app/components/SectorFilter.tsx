'use client'

export interface SectorFilterProps {
  sectors: string[]
  selectedSector: string
  onSelectSector: (sector: string) => void
}

export default function SectorFilter({
  sectors,
  selectedSector,
  onSelectSector,
}: SectorFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {sectors.map((sector) => (
        <button
          key={sector}
          onClick={() => onSelectSector(sector)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedSector === sector
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {sector}
        </button>
      ))}
    </div>
  )
}
