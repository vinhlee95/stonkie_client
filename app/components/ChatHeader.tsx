'use client'

import type { ReactNode } from 'react'
import { Minus } from 'lucide-react'

export interface ChatHeaderProps {
  icon: ReactNode
  title: string
  subtitle?: string
  onClose: () => void
  /** Optional actions rendered before the close button (e.g. "Back to brief"). */
  actions?: ReactNode
}

export default function ChatHeader({ icon, title, subtitle, onClose, actions }: ChatHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-light)] dark:bg-[var(--accent-light-dark)] text-[var(--accent-active)] dark:text-[var(--accent-active-dark)] shrink-0">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate">
            {title}
          </div>
          {subtitle && (
            <div className="text-sm text-gray-500 dark:text-gray-400 leading-tight mt-0.5 truncate">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {actions}
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          aria-label="Close"
        >
          <Minus size={14} />
        </button>
      </div>
    </div>
  )
}
