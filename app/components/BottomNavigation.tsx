'use client'
import Link from 'next/link'
import { ChatBubbleOutline, HomeOutlined } from '@mui/icons-material'
import { Suspense, useState, useEffect } from 'react'
import Chat from './Chat'
import { ChatProvider } from './Chat'

const BottomNavigation = () => {
  const [isChatVisible, setIsChatVisible] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

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
        <div className="flex gap-8 px-6 py-3 rounded-full bg-white/70 dark:bg-[#1C1C1C]/70 backdrop-blur-md shadow-lg border border-gray-200/50 dark:border-gray-800/50">
          <Link
            href="/"
            className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:text-[var(--accent-hover)] dark:hover:text-[var(--accent-hover-dark)] transition-colors duration-200"
          >
            <HomeOutlined fontSize="medium" />
          </Link>

          <button
            onClick={handleChatClick}
            className="p-2 rounded-full text-gray-600 dark:text-gray-400 focus:outline-none hover:text-[var(--accent-hover)] dark:hover:text-[var(--accent-hover-dark)] transition-colors duration-200"
          >
            <ChatBubbleOutline fontSize="medium" />
          </button>
        </div>
      </div>
    </>
  )
}

export default BottomNavigation
