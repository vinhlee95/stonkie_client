'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface ScrollToTopButtonProps {
  onScrollToTop: () => void
}

export default function ScrollToTopButton({ onScrollToTop }: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false)
  const lastScrollY = useRef(0)
  const hasScrolledDown = useRef(false)

  useEffect(() => {
    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const currentY = window.scrollY
        const scrollingUp = currentY < lastScrollY.current
        const pastThreshold = currentY > 300

        if (!pastThreshold) {
          // Near top — hide button and reset
          setVisible(false)
          hasScrolledDown.current = false
        } else if (!scrollingUp) {
          // Scrolling down past threshold — mark that user has scrolled down, hide
          hasScrolledDown.current = true
          setVisible(false)
        } else if (scrollingUp && hasScrolledDown.current) {
          // Scrolling up after having scrolled down — show
          setVisible(true)
        }

        lastScrollY.current = currentY
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleClick = useCallback(() => {
    setVisible(false)
    hasScrolledDown.current = false
    onScrollToTop()
  }, [onScrollToTop])

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Scroll to top of company list"
      title="Back to top"
      className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-active)] text-white shadow-lg hover:brightness-110 active:scale-95 transition-all duration-300 cursor-pointer ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  )
}
