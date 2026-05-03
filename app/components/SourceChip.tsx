'use client'

import { FocusEvent, MouseEvent, useState } from 'react'
import {
  getSourceDisplayLabel,
  getSourcePublisherLabel,
  SourceMetadata,
} from './utils/sourceMetadata'

interface SourceChipProps {
  source: SourceMetadata
}

export default function SourceChip({ source }: SourceChipProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [tooltipAlign, setTooltipAlign] = useState<'left' | 'right'>('left')

  const label = getSourceDisplayLabel(source)
  const publisherLabel = getSourcePublisherLabel(source)
  const titleLabel = source.title?.trim()

  const updateTooltipAlignment = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const estimatedTooltipWidth = 320
    const viewportPadding = 16
    const spaceOnRight = window.innerWidth - rect.left
    setTooltipAlign(spaceOnRight < estimatedTooltipWidth + viewportPadding ? 'right' : 'left')
  }

  const chipClassName = `
    inline-flex items-center py-0.5 px-2 text-xs font-medium rounded-full transition-all
    bg-[var(--button-background)] dark:bg-[var(--button-background-dark)]
    text-gray-700 dark:text-gray-200 hover:bg-[var(--accent-hover)] dark:hover:bg-[var(--accent-hover-dark)]
    border border-[var(--accent-active)] dark:border-[var(--accent-active-dark)]
  `

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={(event: MouseEvent<HTMLElement>) => {
        updateTooltipAlignment(event.currentTarget)
        setIsHovered(true)
      }}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={(event: FocusEvent<HTMLElement>) => {
        updateTooltipAlignment(event.currentTarget)
        setIsHovered(true)
      }}
      onBlur={() => setIsHovered(false)}
    >
      {source.url ? (
        <a href={source.url} target="_blank" rel="noopener noreferrer" className={chipClassName}>
          {label}
        </a>
      ) : (
        <span className={`${chipClassName} text-gray-500 dark:text-gray-400 cursor-default`}>
          {label}
        </span>
      )}

      {isHovered && (
        <div
          role="tooltip"
          className="
            absolute top-[calc(100%+8px)] z-30 w-80 max-w-[calc(100vw-2rem)]
            rounded-lg border border-gray-200 dark:border-gray-700
            bg-white dark:bg-gray-900 shadow-lg p-3
          "
          style={tooltipAlign === 'right' ? { right: 0 } : { left: 0 }}
        >
          {titleLabel && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Title:</span> {titleLabel}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-semibold">Publisher:</span> {publisherLabel}
          </p>
          {source.publishedAt && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Published at:</span> {source.publishedAt}
            </p>
          )}
        </div>
      )}
    </span>
  )
}
