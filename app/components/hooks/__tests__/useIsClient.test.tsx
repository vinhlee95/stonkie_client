import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { useIsClient } from '../useIsClient'

function Probe() {
  return <span>{useIsClient() ? 'client' : 'server'}</span>
}

describe('useIsClient', () => {
  it('is false in server-rendered markup, so local-time text is left out', () => {
    expect(renderToString(<Probe />)).toContain('server')
  })

  it('is true once rendered in the browser', () => {
    const { result } = renderHook(() => useIsClient())
    expect(result.current).toBe(true)
  })
})
