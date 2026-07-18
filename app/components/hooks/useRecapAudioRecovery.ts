'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { stopIfPrefix, useRecapAudio } from './useRecapAudio'

/**
 * Keeps recap audio honest about its 6h signed URLs.
 *
 * - A failed load (almost always an expired URL) refetches the recap queries so
 *   the next tap gets a freshly minted URL. The backend doc is explicit that a
 *   403 means "reload the recap", not "show an error".
 * - On unmount, stops playback of clips this surface started, so a clip can't
 *   keep playing with no visible control. `ownedPrefix` scopes that to the
 *   surface's own track ids — closing the brief modal must not stop a clip
 *   started from a homepage card, which still has its own control on screen.
 *
 * Mount once per surface that renders `RecapAudioControls`, inside the
 * QueryClientProvider.
 */
export function useRecapAudioRecovery(ownedPrefix: string) {
  const { errored } = useRecapAudio()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!errored) return
    void queryClient.invalidateQueries({ queryKey: ['brief-recap'] })
    void queryClient.invalidateQueries({ queryKey: ['ticker-recap'] })
  }, [errored, queryClient])

  useEffect(() => () => stopIfPrefix(ownedPrefix), [ownedPrefix])
}
