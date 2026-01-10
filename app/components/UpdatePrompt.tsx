'use client'

import { useServiceWorker } from './hooks/useServiceWorker'
import { useEffect, useState } from 'react'

export default function UpdatePrompt() {
  const { updateAvailable, updateServiceWorker } = useServiceWorker()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (updateAvailable) {
      setIsVisible(true)
    }
  }, [updateAvailable])

  if (!isVisible) {
    return null
  }

  const handleRefresh = () => {
    updateServiceWorker()
  }

  return (
    <div
      className="fixed bottom-20 left-0 right-0 z-50 flex justify-center px-4 animate-[slideUp_0.3s_ease-out]"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/95 dark:bg-[#1C1C1C]/95 backdrop-blur-xl shadow-lg border border-white/30 dark:border-white/10 max-w-md w-full">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            A new version is available
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-1.5 text-sm font-semibold text-white bg-black dark:bg-white dark:text-black rounded-md hover:opacity-90 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-[#1C1C1C]"
        >
          Refresh
        </button>
      </div>
    </div>
  )
}
