'use client'

export interface IndustryFilterProps {
  industries: string[]
  selectedIndustry: string
  onSelectIndustry: (industry: string) => void
}

export default function IndustryFilter({
  industries,
  selectedIndustry,
  onSelectIndustry,
}: IndustryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {industries.map((industry) => (
        <button
          key={industry}
          onClick={() => onSelectIndustry(industry)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedIndustry === industry
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {industry}
        </button>
      ))}
    </div>
  )
}
