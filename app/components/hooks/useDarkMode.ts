import { useSyncExternalStore } from 'react'

const subscribe = (callback: () => void) => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', callback)
  return () => mediaQuery.removeEventListener('change', callback)
}

const getSnapshot = () => window.matchMedia('(prefers-color-scheme: dark)').matches
const getServerSnapshot = () => false

// Custom hook to detect dark mode
export function useDarkMode() {
  const isDarkMode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return isDarkMode
}
