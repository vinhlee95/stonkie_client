'use client'

import { useMemo } from 'react'
import MarkdownContent from './MarkdownContent'
import SvgBlock from './SvgBlock'
import HtmlIframe from './HtmlIframe'
import { parseVisualBlocks } from './utils/parseVisualBlocks'

interface AnswerContentProps {
  content: string
  isStreaming?: boolean
  smallSize?: boolean
}

export default function AnswerContent({
  content,
  isStreaming = false,
  smallSize = false,
}: AnswerContentProps) {
  const { blocks, pendingVisual } = useMemo(
    () => parseVisualBlocks(content, isStreaming),
    [content, isStreaming],
  )

  // If only text blocks and no pending visual, render as single MarkdownContent for consistency
  if (blocks.length === 1 && blocks[0].type === 'text' && !pendingVisual) {
    return <MarkdownContent content={blocks[0].content} smallSize={smallSize} />
  }

  return (
    <div>
      {blocks.map((block, i) => {
        if (block.type === 'text') {
          return <MarkdownContent key={i} content={block.content} smallSize={smallSize} />
        }
        if (block.lang === 'svg') {
          return <SvgBlock key={i} content={block.content} />
        }
        return <HtmlIframe key={i} content={block.content} />
      })}
      {pendingVisual && (
        <div className="my-4 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center text-sm text-gray-500">
          Rendering visual...
        </div>
      )}
    </div>
  )
}
