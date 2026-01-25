import { ETFCountryAllocation } from '@/types/etf'

/**
 * Format weight percentage with 2 decimal places and % symbol (e.g., 95.83 -> "95.83%")
 */
function formatWeight(weight: number): string {
  return `${weight.toFixed(2)}%`
}

interface ProgressBarProps {
  weight: number
  maxWeight: number
}

function ProgressBar({ weight, maxWeight }: ProgressBarProps) {
  const percentage = (weight / maxWeight) * 100
  return (
    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-[var(--tab-active)] dark:bg-[var(--tab-active-dark)] transition-all"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export default function CountryAllocationChart({
  countryAllocation,
}: {
  countryAllocation: ETFCountryAllocation[]
}) {
  if (countryAllocation.length === 0) {
    return (
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Country Allocation</h2>
        <p className="text-gray-600 dark:text-gray-400">No country allocation data available</p>
      </div>
    )
  }

  // Sort countries by weight (largest to smallest) for better visualization
  const sortedData = [...countryAllocation].sort((a, b) => b.weight_percent - a.weight_percent)
  const maxWeight = Math.max(...sortedData.map((c) => c.weight_percent))

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold mb-4">Country Allocation</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-center border-b border-gray-200">Rank</th>
              <th className="px-4 py-2 text-left border-b border-gray-200">Country</th>
              <th className="px-4 py-2 text-right border-b border-gray-200">Weight</th>
              <th className="px-4 py-2 border-b border-gray-200 w-48 min-w-[200px]"></th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((country, index) => (
              <tr key={`${country.country}-${index}`}>
                <td className="px-4 py-2 border-b border-gray-200 text-center">{index + 1}</td>
                <td className="px-4 py-2 border-b border-gray-200">{country.country}</td>
                <td className="px-4 py-2 border-b border-gray-200 text-right font-mono">
                  {formatWeight(country.weight_percent)}
                </td>
                <td className="px-4 py-2 border-b border-gray-200 w-48 min-w-[200px]">
                  <ProgressBar weight={country.weight_percent} maxWeight={maxWeight} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
