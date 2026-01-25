import { ETFHolding } from '@/types/etf'

/**
 * Format weight percentage with 2 decimal places and % symbol (e.g., 7.38 -> "7.38%")
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

export default function HoldingsTable({ holdings }: { holdings: ETFHolding[] }) {
  if (holdings.length === 0) {
    return (
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Top Holdings</h2>
        <p className="text-gray-600 dark:text-gray-400">No holdings data available</p>
      </div>
    )
  }

  const maxWeight = Math.max(...holdings.map((h) => h.weight_percent))

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold mb-4">Top Holdings</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-center border-b border-gray-200">Rank</th>
              <th className="px-4 py-2 text-left border-b border-gray-200">Holding</th>
              <th className="px-4 py-2 text-right border-b border-gray-200">Weight</th>
              <th className="px-4 py-2 border-b border-gray-200">Visual</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding, index) => (
              <tr key={`${holding.name}-${index}`}>
                <td className="px-4 py-2 border-b border-gray-200 text-center">{index + 1}</td>
                <td className="px-4 py-2 border-b border-gray-200">{holding.name}</td>
                <td className="px-4 py-2 border-b border-gray-200 text-right font-mono">
                  {formatWeight(holding.weight_percent)}
                </td>
                <td className="px-4 py-2 border-b border-gray-200">
                  <ProgressBar weight={holding.weight_percent} maxWeight={maxWeight} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
