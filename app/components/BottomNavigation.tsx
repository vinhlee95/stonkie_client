'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ChatBubbleOutline } from '@mui/icons-material'
import { Suspense, useState } from 'react'
import Chat from './Chat'

const BottomNavigation = () => {
  const pathname = usePathname()
  const [isChatVisible, setIsChatVisible] = useState(false)
  
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path)
  }

  const handleChatClick = () => {
    setIsChatVisible(true)
  }

  const handleChatClose = () => {
    setIsChatVisible(false)
  }

  return (
    <>
      {isChatVisible && (
        <div className="fixed inset-0 z-50">
          <Suspense>
            <Chat onClose={handleChatClose} />
          </Suspense>
        </div>
      )}
      
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
        <div className="flex justify-around py-2">
          <Link href="/" className={`flex flex-col items-center px-4 py-2 text-xs ${isActive('/') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
            <Home fontSize="small" />
            <span className="mt-1">Home</span>
          </Link>
          
          <button 
            onClick={handleChatClick}
            className="flex flex-col items-center px-4 py-2 text-xs text-gray-600 dark:text-gray-400 focus:outline-none"
          >
            <ChatBubbleOutline fontSize="small" />
            <span className="mt-1">Chat</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default BottomNavigation 