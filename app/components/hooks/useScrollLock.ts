'use client'
import { useEffect, useCallback } from 'react'

interface UseScrollLockOptions {
  isLocked: boolean
  isDesktop?: boolean
}

/**
 * Custom hook to disable/enable scrolling on the HTML element
 * Specifically designed to handle Safari and iOS scroll behavior when modals are open
 *
 * Behavior:
 * - Mobile: Completely locks background scrolling using position:fixed and event prevention
 * - Desktop: No scroll lock applied - modal should be positioned within viewport
 * - Safari: Uses enhanced detection and Safari-specific fixes for better compatibility
 */
export const useScrollLock = ({ isLocked, isDesktop = false }: UseScrollLockOptions) => {
  // Detect Safari browser (more accurate detection)
  const isSafari = useCallback(() => {
    if (typeof window === 'undefined') return false
    const userAgent = navigator.userAgent.toLowerCase()
    const vendor = navigator.vendor?.toLowerCase() || ''

    // Check for Safari (both desktop and mobile)
    return (
      vendor.includes('apple') &&
      userAgent.includes('safari') &&
      !userAgent.includes('chrome') &&
      !userAgent.includes('chromium') &&
      !userAgent.includes('edg') &&
      !userAgent.includes('firefox')
    )
  }, [])

  // Detect iOS Safari specifically
  const isIOSSafari = useCallback(() => {
    if (typeof window === 'undefined') return false
    const userAgent = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    const isSafariUA = /Safari/.test(userAgent) && !/CriOS|FxiOS|OPiOS|mercury/.test(userAgent)
    return isIOS && isSafariUA
  }, [])

  useEffect(() => {
    if (!isLocked) return

    // Store original styles for both body and html
    const originalBodyOverflow = document.body.style.overflow
    const originalBodyPosition = document.body.style.position
    const originalBodyWidth = document.body.style.width
    const originalBodyHeight = document.body.style.height
    const originalBodyTop = document.body.style.top
    const originalBodyLeft = document.body.style.left
    const originalBodyRight = document.body.style.right

    const originalHtmlOverflow = document.documentElement.style.overflow
    const originalHtmlHeight = document.documentElement.style.height
    const originalHtmlPosition = document.documentElement.style.position

    // Store current scroll position
    const scrollY = window.scrollY
    const scrollX = window.scrollX

    // Safari-specific touch event handlers
    const preventDefault = (e: Event) => {
      e.preventDefault()
    }

    const preventTouchMove = (e: TouchEvent) => {
      // Allow scrolling within modal content
      const target = e.target as Element
      const modalContent = target.closest('.modal-content')

      // If touch is outside modal content, prevent it
      if (!modalContent) {
        e.preventDefault()
        return false
      }

      // If touch is within modal content, allow normal scrolling
      // The modal content should handle its own overflow scrolling
      return true
    }

    if (!isDesktop) {
      // Mobile: Apply comprehensive scroll lock with Safari-specific fixes
      if (isSafari() || isIOSSafari()) {
        // Safari-specific approach using CSS classes and inline styles
        document.documentElement.classList.add('safari-scroll-lock')
        document.body.classList.add('safari-scroll-lock')

        // Still need inline styles for positioning
        document.body.style.top = `-${scrollY}px`
        document.body.style.left = `-${scrollX}px`

        // Add touch event listeners for Safari
        // Only add to document.body to be more specific
        document.body.addEventListener('touchmove', preventTouchMove, { passive: false })
        document.body.addEventListener('wheel', preventDefault, { passive: false })
      } else {
        // Standard mobile approach for other browsers
        document.documentElement.style.overflow = 'hidden'
        document.documentElement.style.height = '100%'

        document.body.style.overflow = 'hidden'
        document.body.style.position = 'fixed'
        document.body.style.top = `-${scrollY}px`
        document.body.style.left = `-${scrollX}px`
        document.body.style.width = '100%'
        document.body.style.height = '100%'
      }
    }

    // Desktop: No scroll lock needed - early return with empty cleanup
    if (isDesktop) {
      return () => {
        // No cleanup needed for desktop
      }
    }

    // Cleanup function to restore original scroll behavior (mobile only)
    return () => {
      // Remove Safari-specific event listeners
      document.body.removeEventListener('touchmove', preventTouchMove)
      document.body.removeEventListener('wheel', preventDefault)

      // Remove Safari-specific CSS classes
      document.documentElement.classList.remove('safari-scroll-lock')
      document.body.classList.remove('safari-scroll-lock')

      // Restore HTML styles
      document.documentElement.style.overflow = originalHtmlOverflow
      document.documentElement.style.height = originalHtmlHeight
      document.documentElement.style.position = originalHtmlPosition
      document.documentElement.style.width = ''

      // Restore body styles
      document.body.style.overflow = originalBodyOverflow
      document.body.style.position = originalBodyPosition
      document.body.style.top = originalBodyTop
      document.body.style.left = originalBodyLeft
      document.body.style.right = originalBodyRight
      document.body.style.width = originalBodyWidth
      document.body.style.height = originalBodyHeight

      // Restore scroll position on mobile
      if (!isDesktop) {
        // Use requestAnimationFrame for smoother restoration in Safari
        requestAnimationFrame(() => {
          window.scrollTo(scrollX, scrollY)
        })
      }
    }
  }, [isLocked, isDesktop, isSafari, isIOSSafari])
}
