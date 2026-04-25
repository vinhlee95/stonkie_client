import { useState } from 'react'

interface ResourceChipsProps {
  resources: { url?: string; label: string }[]
}

export default function ResourceChips({ resources }: ResourceChipsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [tooltipAlign, setTooltipAlign] = useState<'left' | 'right'>('left')

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {resources.map((resource, idx) =>
        resource.url ? (
          <span
            key={idx}
            className="relative inline-flex"
            onMouseEnter={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              const estimatedTooltipWidth = 320
              const viewportPadding = 16
              const spaceOnRight = window.innerWidth - rect.left
              setTooltipAlign(
                spaceOnRight < estimatedTooltipWidth + viewportPadding ? 'right' : 'left',
              )
              setHoveredIndex(idx)
            }}
            onMouseLeave={() => setHoveredIndex((current) => (current === idx ? null : current))}
            onFocus={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              const estimatedTooltipWidth = 320
              const viewportPadding = 16
              const spaceOnRight = window.innerWidth - rect.left
              setTooltipAlign(
                spaceOnRight < estimatedTooltipWidth + viewportPadding ? 'right' : 'left',
              )
              setHoveredIndex(idx)
            }}
            onBlur={() => setHoveredIndex((current) => (current === idx ? null : current))}
          >
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                py-1 px-2 text-xs font-medium rounded-full transition-all cursor-pointer
                bg-[var(--button-background)] dark:bg-[var(--button-background-dark)]
                text-gray-700 dark:text-gray-200 hover:bg-[var(--accent-hover)] dark:hover:bg-[var(--accent-hover-dark)]
                border border-[var(--accent-active)] dark:border-[var(--accent-active-dark)]
              `}
            >
              {resource.label}
            </a>

            {hoveredIndex === idx && (
              <div
                role="tooltip"
                className="
                  absolute top-[calc(100%+8px)] z-30 w-80 max-w-[calc(100vw-2rem)]
                  rounded-lg border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-900 shadow-lg p-3
                "
                style={tooltipAlign === 'right' ? { right: 0 } : { left: 0 }}
              >
                <p className="text-xs text-gray-600 dark:text-gray-400 break-words">
                  {resource.label}
                </p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 break-all">
                  {resource.url}
                </p>
              </div>
            )}
          </span>
        ) : (
          <span
            key={idx}
            className={`
              py-1 px-2 text-xs font-medium rounded-full
              bg-[var(--button-background)] dark:bg-[var(--button-background-dark)]
              text-gray-500 dark:text-gray-400
              border border-[var(--accent-active)] dark:border-[var(--accent-active-dark)]
            `}
          >
            {resource.label}
          </span>
        ),
      )}
    </div>
  )
}
