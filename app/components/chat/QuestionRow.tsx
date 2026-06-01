'use client'

import { ArrowUpRight } from 'lucide-react'

export interface QuestionRowProps {
  question: string
  onAsk: (question: string) => void
}

export default function QuestionRow({ question, onAsk }: QuestionRowProps) {
  return (
    <button
      onClick={() => onAsk(question)}
      className="w-full text-left flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[var(--card-background)] px-3.5 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer group"
    >
      <span className="text-base md:text-lg text-gray-700 dark:text-gray-300 group-hover:text-[var(--accent-hover)] dark:group-hover:text-[var(--accent-hover-dark)] transition-colors">
        {question}
      </span>
      <ArrowUpRight
        size={14}
        className="text-gray-400 dark:text-gray-500 shrink-0 group-hover:text-[var(--accent-hover)] dark:group-hover:text-[var(--accent-hover-dark)] transition-colors"
      />
    </button>
  )
}
