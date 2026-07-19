import { screen, fireEvent, act } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import RecapAudioControls from '../RecapAudioControls'
import {
  __getRecapAudioElement,
  __resetRecapAudio,
  setRecapAudioExpiryHandler,
} from '../hooks/useRecapAudio'
import type { RecapAudio } from '@/lib/api/marketRecap'

const AUDIO: RecapAudio = {
  url: 'https://storage.googleapis.com/stonkie-recap-audio/us.mp3?X-Goog-Signature=abc',
  duration_s: 120,
}

/**
 * jsdom has no media stack: play() is undefined and src assignment never loads.
 * Stub the bits the store touches so the shared element behaves predictably.
 */
function stubMediaElement() {
  // `paused` is the real element's source of truth for playback state, and the
  // store reads it rather than trusting event order, so the stub tracks it too.
  let paused = true
  const play = vi.fn().mockImplementation(function (this: HTMLAudioElement) {
    paused = false
    this.dispatchEvent(new Event('play'))
    return Promise.resolve()
  })
  const pause = vi.fn().mockImplementation(function (this: HTMLAudioElement) {
    paused = true
    this.dispatchEvent(new Event('pause'))
  })
  vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(() => paused)
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause)
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
  return { play, pause }
}

describe('RecapAudioControls', () => {
  beforeEach(() => {
    __resetRecapAudio()
    vi.restoreAllMocks()
  })

  it('renders nothing when the recap has no audio', () => {
    const { container } = render(
      <RecapAudioControls audio={null} trackId="market:US:257" title="US Pulse" />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when audio is undefined', () => {
    const { container } = render(
      <RecapAudioControls audio={undefined} trackId="market:US:257" title="US Pulse" />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the total time from duration_s before anything loads', () => {
    render(<RecapAudioControls audio={AUDIO} trackId="market:US:257" title="US Pulse" />)
    expect(screen.getByText('2:00')).toBeInTheDocument()
  })

  it('starts playback and swaps to a pause control', async () => {
    const { play } = stubMediaElement()
    render(<RecapAudioControls audio={AUDIO} trackId="market:US:257" title="US Pulse" />)

    fireEvent.click(screen.getByRole('button', { name: 'Listen to US Pulse' }))

    expect(play).toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: 'Pause US Pulse' })).toBeInTheDocument()
  })

  it('pauses when the active track is clicked again', async () => {
    const { pause } = stubMediaElement()
    render(<RecapAudioControls audio={AUDIO} trackId="market:US:257" title="US Pulse" />)

    fireEvent.click(screen.getByRole('button', { name: 'Listen to US Pulse' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Pause US Pulse' }))

    expect(pause).toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: 'Listen to US Pulse' })).toBeInTheDocument()
  })

  it('stops the previous clip when another card starts — only one plays at a time', async () => {
    stubMediaElement()
    render(
      <>
        <RecapAudioControls audio={AUDIO} trackId="market:US:257" title="US Pulse" />
        <RecapAudioControls audio={AUDIO} trackId="market:VN:258" title="Vietnam recap" />
      </>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Listen to US Pulse' }))
    await screen.findByRole('button', { name: 'Pause US Pulse' })

    fireEvent.click(screen.getByRole('button', { name: 'Listen to Vietnam recap' }))

    expect(await screen.findByRole('button', { name: 'Pause Vietnam recap' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Listen to US Pulse' })).toBeInTheDocument()
  })

  it('loads the signed URL without crossOrigin — the bucket serves no CORS headers', () => {
    stubMediaElement()
    render(<RecapAudioControls audio={AUDIO} trackId="market:US:257" title="US Pulse" />)

    fireEvent.click(screen.getByRole('button', { name: 'Listen to US Pulse' }))

    const el = __getRecapAudioElement()
    expect(el?.src).toBe(AUDIO.url)
    expect(el?.crossOrigin).toBeNull()
  })

  it('exposes a scrubber and rate toggle once the clip is active', async () => {
    stubMediaElement()
    render(<RecapAudioControls audio={AUDIO} trackId="market:US:257" title="US Pulse" />)

    expect(screen.queryByRole('slider')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Listen to US Pulse' }))

    const slider = await screen.findByRole('slider', { name: 'Seek within US Pulse' })
    expect(slider).toHaveAttribute('max', '120')

    const rate = screen.getByRole('button', { name: 'Change playback speed' })
    expect(rate).toHaveTextContent('1x')
    fireEvent.click(rate)
    expect(rate).toHaveTextContent('1.25x')
  })

  it('collapses back to the play button when another clip takes over', async () => {
    stubMediaElement()
    render(
      <>
        <RecapAudioControls audio={AUDIO} trackId="market:US:257" title="US Pulse" />
        <RecapAudioControls audio={AUDIO} trackId="market:VN:258" title="Vietnam recap" />
      </>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Listen to US Pulse' }))
    expect(await screen.findByRole('slider', { name: 'Seek within US Pulse' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Listen to Vietnam recap' }))

    await screen.findByRole('slider', { name: 'Seek within Vietnam recap' })
    expect(screen.queryByRole('slider', { name: 'Seek within US Pulse' })).not.toBeInTheDocument()
  })

  it('ignores a stale pause event fired after the new clip started', async () => {
    stubMediaElement()
    render(
      <>
        <RecapAudioControls audio={AUDIO} trackId="market:US:257" title="US Pulse" />
        <RecapAudioControls audio={AUDIO} trackId="market:VN:258" title="Vietnam recap" />
      </>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Listen to US Pulse' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Listen to Vietnam recap' }))
    await screen.findByRole('button', { name: 'Pause Vietnam recap' })

    // Swapping `src` mid-playback makes the browser emit `pause` for the clip that
    // was interrupted — after the replacement is already playing.
    act(() => {
      __getRecapAudioElement()!.dispatchEvent(new Event('pause'))
    })

    expect(screen.getByRole('button', { name: 'Pause Vietnam recap' })).toBeInTheDocument()
  })

  it('stops playback when the control showing the clip unmounts', async () => {
    const { pause } = stubMediaElement()
    const { unmount } = render(
      <RecapAudioControls audio={AUDIO} trackId="home:ticker:NVDA:412" title="NVDA recap" />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Listen to NVDA recap' }))
    await screen.findByRole('button', { name: 'Pause NVDA recap' })

    unmount()

    expect(pause).toHaveBeenCalled()
    expect(__getRecapAudioElement()!.getAttribute('src')).toBeNull()
  })

  it('keeps playing while another control still shows the same clip', async () => {
    stubMediaElement()
    // The favourites list renders each card twice — a desktop grid and a mobile
    // rail — so one copy unmounting must not silence the other.
    function Pair({ showSecond }: { showSecond: boolean }) {
      return (
        <>
          <RecapAudioControls audio={AUDIO} trackId="home:ticker:NVDA:412" title="NVDA recap" />
          {showSecond && (
            <RecapAudioControls audio={AUDIO} trackId="home:ticker:NVDA:412" title="NVDA recap" />
          )}
        </>
      )
    }
    const { rerender } = render(<Pair showSecond />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Listen to NVDA recap' })[0]!)
    await screen.findAllByRole('button', { name: 'Pause NVDA recap' })

    rerender(<Pair showSecond={false} />)

    expect(screen.getByRole('button', { name: 'Pause NVDA recap' })).toBeInTheDocument()
  })

  it('stops playback when a cadence toggle swaps the recap out from under it', async () => {
    stubMediaElement()
    const { rerender } = render(
      <RecapAudioControls audio={AUDIO} trackId="ticker-page:NVDA:daily" title="NVDA recap" />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Listen to NVDA recap' }))
    await screen.findByRole('button', { name: 'Pause NVDA recap' })

    rerender(
      <RecapAudioControls audio={AUDIO} trackId="ticker-page:NVDA:weekly" title="NVDA recap" />,
    )

    expect(await screen.findByRole('button', { name: 'Listen to NVDA recap' })).toBeInTheDocument()
  })

  it('notifies the expiry handler so the app can refetch a fresh URL', async () => {
    stubMediaElement()
    const onExpired = vi.fn()
    setRecapAudioExpiryHandler(onExpired)
    render(<RecapAudioControls audio={AUDIO} trackId="market:US:257" title="US Pulse" />)

    fireEvent.click(screen.getByRole('button', { name: 'Listen to US Pulse' }))
    await screen.findByRole('button', { name: 'Pause US Pulse' })

    act(() => {
      fireEvent.error(__getRecapAudioElement()!)
    })

    expect(onExpired).toHaveBeenCalledTimes(1)
  })

  it('offers a retry when the signed URL has expired', async () => {
    stubMediaElement()
    render(<RecapAudioControls audio={AUDIO} trackId="market:US:257" title="US Pulse" />)

    fireEvent.click(screen.getByRole('button', { name: 'Listen to US Pulse' }))
    await screen.findByRole('button', { name: 'Pause US Pulse' })

    // A 403 on an expired signed URL surfaces as the element's `error` event.
    fireEvent.error(__getRecapAudioElement()!)

    expect(
      await screen.findByRole('button', { name: 'Retry listening to US Pulse' }),
    ).toBeInTheDocument()
  })
})
