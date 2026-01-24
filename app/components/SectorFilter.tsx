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
    <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-2 overflow-x-auto sm:flex-wrap pb-2 sm:pb-0">
        {sectors.map((sector) => (
          <button
            key={sector}
            onClick={() => onSelectSector(sector)}
            style={
              selectedSector === sector
                ? {
                    backgroundColor: 'var(--accent-active)',
                    color: 'white',
                  }
                : undefined
            }
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer ${
              selectedSector === sector
                ? 'dark:bg-[var(--accent-active-dark)]'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {sector}
          </button>
        ))}
      </div>
    </div>
  )
}
