import { useEffect, useState, useCallback } from 'react'

interface ServiceWorkerState {
  updateAvailable: boolean
  waitingWorker: ServiceWorker | null
}

export function useServiceWorker() {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    updateAvailable: false,
    waitingWorker: null,
  })

  const updateServiceWorker = useCallback(() => {
    if (swState.waitingWorker) {
      // Send message to waiting service worker to skip waiting
      swState.waitingWorker.postMessage({ type: 'SKIP_WAITING' })

      // Listen for controller change to reload the page
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }, [swState.waitingWorker])

  useEffect(() => {
    // Only run in browser and if service workers are supported
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // Only register in production
    if (process.env.NODE_ENV === 'development') {
      return
    }

    let registration: ServiceWorkerRegistration | null = null

    const registerServiceWorker = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        // Check for updates immediately
        await registration.update()

        // Handle updates
        const handleUpdate = (reg: ServiceWorkerRegistration) => {
          if (reg.waiting) {
            // There's a waiting service worker
            setSwState({
              updateAvailable: true,
              waitingWorker: reg.waiting,
            })
          }

          // Listen for new service worker installing
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (!newWorker) return

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is installed and waiting
                setSwState({
                  updateAvailable: true,
                  waitingWorker: newWorker,
                })
              }
            })
          })
        }

        // Check if there's already a waiting worker
        if (registration.waiting) {
          handleUpdate(registration)
        }

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          if (registration) {
            handleUpdate(registration)
          }
        })

        // Periodically check for updates (every hour)
        const updateInterval = setInterval(
          () => {
            if (registration) {
              registration.update()
            }
          },
          60 * 60 * 1000,
        )

        return () => {
          clearInterval(updateInterval)
        }
      } catch (error) {
        console.error('Service worker registration failed:', error)
      }
    }

    // Register service worker when page loads
    if (document.readyState === 'complete') {
      registerServiceWorker()
    } else {
      window.addEventListener('load', registerServiceWorker)
    }

    return () => {
      // Cleanup if needed
    }
  }, [])

  return {
    updateAvailable: swState.updateAvailable,
    updateServiceWorker,
  }
}
