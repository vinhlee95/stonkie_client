'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useEffect, useState } from 'react'
import { setRecapAudioExpiryHandler } from '@/app/components/hooks/useRecapAudio'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 60 * 1000, // 10 minutes
            gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      }),
  )

  // Recap audio URLs are signed and expire after 6h. A failed clip load means the
  // cached recap is stale, so refetch it to mint a fresh URL for the next tap.
  useEffect(() => {
    setRecapAudioExpiryHandler(() => {
      void queryClient.invalidateQueries({ queryKey: ['brief-recap'] })
      void queryClient.invalidateQueries({ queryKey: ['ticker-recap'] })
    })
    return () => setRecapAudioExpiryHandler(null)
  }, [queryClient])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
