import { ETFSectorAllocation } from '@/types/etf'

/**
 * Format weight percentage with 2 decimal places and % symbol (e.g., 36.15 -> "36.15%")
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

export default function SectorAllocationChart({
  sectorAllocation,
}: {
  sectorAllocation: ETFSectorAllocation[]
}) {
  if (sectorAllocation.length === 0) {
    return (
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Sector Allocation</h2>
        <p className="text-gray-600 dark:text-gray-400">No sector allocation data available</p>
      </div>
    )
  }

  // Sort sectors by weight (largest to smallest) for better visualization
  const sortedData = [...sectorAllocation].sort((a, b) => b.weight_percent - a.weight_percent)
  const maxWeight = Math.max(...sortedData.map((s) => s.weight_percent))

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold mb-4">Sector Allocation</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-center border-b border-gray-200">Rank</th>
              <th className="px-4 py-2 text-left border-b border-gray-200">Sector</th>
              <th className="px-4 py-2 text-right border-b border-gray-200">Weight</th>
              <th className="px-4 py-2 border-b border-gray-200 w-48 min-w-[200px]"></th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((sector, index) => (
              <tr key={`${sector.sector}-${index}`}>
                <td className="px-4 py-2 border-b border-gray-200 text-center">{index + 1}</td>
                <td className="px-4 py-2 border-b border-gray-200">{sector.sector}</td>
                <td className="px-4 py-2 border-b border-gray-200 text-right font-mono">
                  {formatWeight(sector.weight_percent)}
                </td>
                <td className="px-4 py-2 border-b border-gray-200 w-48 min-w-[200px]">
                  <ProgressBar weight={sector.weight_percent} maxWeight={maxWeight} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
