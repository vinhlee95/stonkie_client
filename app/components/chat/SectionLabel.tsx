'use client'

import type { ReactNode } from 'react'

interface SectionLabelProps {
  icon: ReactNode
  children: ReactNode
  accessory?: ReactNode
}

export default function SectionLabel({ icon, children, accessory }: SectionLabelProps) {
  return (
    <div className="mt-6 mb-2.5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400">
          {children}
        </span>
      </div>
      {accessory}
    </div>
  )
}
