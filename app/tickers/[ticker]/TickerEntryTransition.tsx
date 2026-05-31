'use client'

import { useEffect, useState } from 'react'

/** Set by callers (e.g. watchlist rows) right before navigating here. */
export const TICKER_SLIDE_IN_FLAG = 'stonkie_ticker_slidein'

/**
 * Plays a slide-in-from-right animation on mount, but only when the navigation
 * opted in via the session flag (so direct loads / back-nav stay static).
 */
export default function TickerEntryTransition({ children }: { children: React.ReactNode }) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem(TICKER_SLIDE_IN_FLAG)) return
    sessionStorage.removeItem(TICKER_SLIDE_IN_FLAG)
    // Defer to a frame callback so the animation runs after first paint (and to
    // avoid setting state synchronously in the effect body).
    const raf = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return <div className={animate ? 'ticker-slide-in' : undefined}>{children}</div>
}
