'use client'
import Link from 'next/link'
import { ChatBubbleOutline, HomeOutlined, SearchOutlined } from '@mui/icons-material'
import { Suspense, useState, useEffect } from 'react'
import Chat from './Chat'
import { ChatProvider } from './Chat'
import SpotlightSearch from './SpotlightSearch'
import { useScrollLock } from './hooks/useScrollLock'
import { usePopularCompanies } from './hooks/usePopularCompanies'

const BottomNavigation = () => {
  const [isChatVisible, setIsChatVisible] = useState(false)
  const [isChatClosing, setIsChatClosing] = useState(false)
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  // Prefetch popular companies on mount so search is instant when opened
  usePopularCompanies()

  useScrollLock({ isLocked: isChatVisible || isSearchVisible, isDesktop })

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  // Cmd+K / Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsChatVisible(false)
        setIsSearchVisible((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearchClick = () => {
    setIsChatVisible(false)
    setIsSearchVisible(true)
  }

  const handleSearchClose = () => {
    setIsSearchVisible(false)
  }

  const handleChatClick = () => {
    setIsSearchVisible(false)
    setIsChatClosing(false)
    setIsChatVisible(true)
  }

  // Animated close: slide the modal down, then unmount. Matches the duration of
  // the ChatboxUI translate-y transition (300ms).
  const handleChatClose = () => {
    setIsChatClosing(true)
    setTimeout(() => {
      setIsChatVisible(false)
      setIsChatClosing(false)
    }, 300)
  }

  return (
    <>
      <Suspense>
        <ChatProvider>
          {isChatVisible && (
            <Chat onClose={handleChatClose} isDesktop={isDesktop} isClosing={isChatClosing} />
          )}
        </ChatProvider>
      </Suspense>

      {isSearchVisible && <SpotlightSearch onClose={handleSearchClose} />}

      <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center">
        <div className="relative flex gap-6 px-8 py-3 rounded-full bg-white/40 dark:bg-[#1C1C1C]/40 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] border border-white/30 dark:border-white/10 overflow-hidden">
          <Link
            href="/"
            className="group relative p-2.5 rounded-full text-gray-700 dark:text-gray-300 transition-all duration-300 hover:scale-110 active:scale-95 z-10"
          >
            <div className="absolute -inset-y-3 -inset-x-8 rounded-full bg-gradient-to-br from-white/80 to-white/30 dark:from-white/30 dark:to-white/10 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 backdrop-blur-sm border-r border-white/40 dark:border-white/20 pointer-events-none" />
            <div className="absolute -inset-y-3 -inset-x-8 rounded-full shadow-[inset_0_2px_8px_rgba(255,255,255,0.6),inset_0_-2px_8px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_2px_8px_rgba(255,255,255,0.3),inset_0_-2px_8px_rgba(0,0,0,0.4)] opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none" />
            <HomeOutlined fontSize="medium" className="relative z-10" />
          </Link>

          <button
            onClick={handleSearchClick}
            className="group relative p-2.5 rounded-full text-gray-700 dark:text-gray-300 focus:outline-none transition-all duration-300 hover:scale-110 active:scale-95 z-10"
            aria-label="Search"
          >
            <div className="absolute -inset-y-3 -inset-x-8 rounded-full bg-gradient-to-br from-white/80 to-white/30 dark:from-white/30 dark:to-white/10 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 backdrop-blur-sm border-white/40 dark:border-white/20 pointer-events-none" />
            <div className="absolute -inset-y-3 -inset-x-8 rounded-full shadow-[inset_0_2px_8px_rgba(255,255,255,0.6),inset_0_-2px_8px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_2px_8px_rgba(255,255,255,0.3),inset_0_-2px_8px_rgba(0,0,0,0.4)] opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none" />
            <SearchOutlined fontSize="medium" className="relative z-10" />
          </button>

          <button
            onClick={handleChatClick}
            className="group relative p-2.5 rounded-full text-gray-700 dark:text-gray-300 focus:outline-none transition-all duration-300 hover:scale-110 active:scale-95 z-10"
          >
            <div className="absolute -inset-y-3 -inset-x-8 rounded-full bg-gradient-to-br from-white/80 to-white/30 dark:from-white/30 dark:to-white/10 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 backdrop-blur-sm border-l border-white/40 dark:border-white/20 pointer-events-none" />
            <div className="absolute -inset-y-3 -inset-x-8 rounded-full shadow-[inset_0_2px_8px_rgba(255,255,255,0.6),inset_0_-2px_8px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_2px_8px_rgba(255,255,255,0.3),inset_0_-2px_8px_rgba(0,0,0,0.4)] opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none" />
            <ChatBubbleOutline fontSize="medium" className="relative z-10" />
          </button>
        </div>
      </div>
    </>
  )
}

export default BottomNavigation
