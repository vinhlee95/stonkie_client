'use client'

import { useState, useEffect, useRef } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './Collapsible'
import { ChevronDown, Sparkles } from 'lucide-react'
import MarkdownContent from './MarkdownContent'

export function ThoughtBubble({
  thought,
  isThinking,
}: {
  thought: string | null
  isThinking: boolean
}) {
  const [currentThought, setCurrentThought] = useState('')
  const [isOpen, setIsOpen] = useState(true)
  const [completedThoughts, setCompletedThoughts] = useState<string[]>([])
  const lastThoughtRef = useRef<string | null>(null)
  const isTypingRef = useRef(false)

  useEffect(() => {
    setIsOpen(isThinking)
  }, [isThinking])

  useEffect(() => {
    if (!thought || thought === lastThoughtRef.current) {
      return
    }

    // If we're currently typing, wait for it to complete
    if (isTypingRef.current) {
      const checkInterval = setInterval(() => {
        if (!isTypingRef.current) {
          clearInterval(checkInterval)
          startTypingThought(thought)
        }
      }, 100)
      return () => clearInterval(checkInterval)
    }

    startTypingThought(thought)
  }, [thought])

  const startTypingThought = (thought: string) => {
    isTypingRef.current = true
    let charIndex = 0
    setCurrentThought('')

    const typeThought = () => {
      if (!thought) return
      if (charIndex < thought.length) {
        setCurrentThought(thought.slice(0, charIndex + 1))
        charIndex++
        setTimeout(typeThought, 10)
      } else {
        // When done, add to completedThoughts and update lastThoughtRef
        setCompletedThoughts((prev) => [...prev, thought])
        lastThoughtRef.current = thought
        setCurrentThought('')
        isTypingRef.current = false
      }
    }
    setTimeout(typeThought, 50)
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-lg">
      <div className="relative">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-[var(--accent-hover)] dark:text-[var(--accent-hover-dark)] hover:text-[var(--accent-active)] dark:hover:text-[var(--accent-active-dark)] transition-colors">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">{isThinking ? 'AI is thinking...' : 'AI thoughts'}</span>
              {isThinking && (
                <div className="flex gap-1">
                  <div
                    className="w-1 h-1 bg-[var(--accent-hover)] dark:bg-[var(--accent-hover-dark)] rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-[var(--accent-hover)] dark:bg-[var(--accent-hover-dark)] rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-1 h-1 bg-[var(--accent-hover)] dark:bg-[var(--accent-hover-dark)] rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  ></div>
                </div>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>

          {completedThoughts && completedThoughts.length > 0 && (
            <CollapsibleContent className="mt-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="space-y-2">
                  {completedThoughts.map((t, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-600 dark:text-gray-300 opacity-75"
                    >
                      <MarkdownContent content={t} smallSize />
                    </div>
                  ))}
                  {currentThought && (
                    <div className="text-sm text-[var(--accent-hover)] dark:text-[var(--accent-hover-dark)] flex items-center gap-2">
                      <MarkdownContent content={currentThought} smallSize />
                      <span className="w-2 h-4 bg-[var(--accent-hover)] dark:bg-[var(--accent-hover-dark)] animate-pulse"></span>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    </div>
  )
}
