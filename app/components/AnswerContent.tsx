'use client'

import MarkdownContent from './MarkdownContent'
import SvgBlock from './SvgBlock'
import HtmlIframe from './HtmlIframe'
import { VisualBlock } from './hooks/useChatState'

interface AnswerContentProps {
  content: string
  visualBlocks?: VisualBlock[]
  smallSize?: boolean
}

type RenderPart = { type: 'text'; content: string } | { type: 'visual'; blockId: string }

function splitByVisualMarkers(content: string): RenderPart[] {
  if (!content) return []

  const re = /\[\[VISUAL_BLOCK:([a-zA-Z0-9_-]+)\]\]/g
  const parts: RenderPart[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index)
      if (text) {
        parts.push({ type: 'text', content: text })
      }
    }

    parts.push({ type: 'visual', blockId: match[1] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    const text = content.slice(lastIndex)
    if (text) {
      parts.push({ type: 'text', content: text })
    }
  }

  return parts
}

export default function AnswerContent({
  content,
  visualBlocks = [],
  smallSize = false,
}: AnswerContentProps) {
  const parts = splitByVisualMarkers(content)
  const blockMap = new Map(visualBlocks.map((block) => [block.blockId, block]))

  // Fast path for simple text-only responses
  if (!content.includes('[[VISUAL_BLOCK:')) {
    return <MarkdownContent content={content} smallSize={smallSize} />
  }

  return (
    <div>
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return <MarkdownContent key={`text-${i}`} content={part.content} smallSize={smallSize} />
        }

        const visual = blockMap.get(part.blockId)
        if (!visual || visual.status === 'streaming') {
          return (
            <div
              key={`visual-${part.blockId}`}
              className="my-4 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center text-sm text-gray-500"
            >
              Rendering visual...
            </div>
          )
        }

        if (visual.status === 'error') {
          return (
            <div
              key={`visual-${part.blockId}`}
              className="my-4 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300 px-4 py-3 text-sm"
            >
              {visual.errorMessage || 'Failed to render visual content.'}
            </div>
          )
        }

        if (visual.lang === 'svg') {
          return <SvgBlock key={`visual-${part.blockId}`} content={visual.content} />
        }

        return <HtmlIframe key={`visual-${part.blockId}`} content={visual.content} />
      })}
    </div>
  )
}
