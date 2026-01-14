'use client'
import Link from 'next/link'
import { ChatBubbleOutline, HomeOutlined } from '@mui/icons-material'
import { Suspense, useState, useEffect } from 'react'
import { usePathname, useParams } from 'next/navigation'
import Chat from './Chat'
import { ChatProvider } from './Chat'
import { useScrollLock } from './hooks/useScrollLock'
import { useFAQQuery } from './hooks/useFAQQuery'

const BottomNavigation = () => {
  const [isChatVisible, setIsChatVisible] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const pathname = usePathname()
  const params = useParams()
  const ticker = params.ticker as string | undefined

  // Pre-fetch FAQs based on current route
  // On home page: fetch general FAQs (ticker is undefined)
  // On ticker pages: fetch ticker-specific FAQs
  useFAQQuery(pathname.startsWith('/tickers/') ? ticker : undefined)

  // Use the scroll lock hook to disable HTML scrolling when chat is open
  useScrollLock({ isLocked: isChatVisible, isDesktop })

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const handleChatClick = () => {
    setIsChatVisible(true)
  }

  const handleChatClose = () => {
    setIsChatVisible(false)
  }

  return (
    <>
      <Suspense>
        <ChatProvider>
          {isChatVisible && <Chat onClose={handleChatClose} isDesktop={isDesktop} />}
        </ChatProvider>
      </Suspense>

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
