import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/** False during SSR and hydration, true afterwards: for values that differ between server and browser, like local time. */
export function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
