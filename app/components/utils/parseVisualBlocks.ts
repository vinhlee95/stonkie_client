export type TextBlock = { type: 'text'; content: string }
export type VisualBlock = { type: 'visual'; lang: 'svg' | 'html'; content: string }
export type Block = TextBlock | VisualBlock

export interface ParseResult {
  blocks: Block[]
  pendingVisual: boolean
}

// Regex for complete visual fenced blocks: ```svg\n...\n``` or ```html\n...\n```
const COMPLETE_FENCE_RE = /```(svg|html)\n([\s\S]*?)```/g

/**
 * Parses a raw answer string into an array of text and visual blocks.
 *
 * During streaming (isStreaming=true), an unclosed fence is buffered and excluded
 * from blocks. When not streaming, unclosed fences are treated as plain text.
 */
export function parseVisualBlocks(raw: string, isStreaming: boolean = false): ParseResult {
  if (!raw) {
    return { blocks: [], pendingVisual: false }
  }

  // Check for unclosed visual fence at the end (streaming case)
  let textToParse = raw
  let pendingVisual = false

  if (isStreaming) {
    // First, strip out all complete fences to check if there's an unclosed one after
    const withoutComplete = raw.replace(COMPLETE_FENCE_RE, '___FENCE___')
    const unclosedMatch = withoutComplete.match(/```(svg|html)\n[\s\S]*$/)

    if (unclosedMatch) {
      // Find the position of this unclosed fence in the original string
      // We need to find the last ```svg or ```html that isn't part of a complete fence
      const lastSvgIdx = raw.lastIndexOf('```svg\n')
      const lastHtmlIdx = raw.lastIndexOf('```html\n')
      const unclosedIdx = Math.max(lastSvgIdx, lastHtmlIdx)

      // Verify this isn't part of a complete fence by checking if there's a closing ``` after it
      // Find the end of the opening fence line (after the newline following the lang tag)
      const afterOpen = raw.substring(raw.indexOf('\n', unclosedIdx) + 1)
      // Find first ``` that's on its own line (closing fence)
      const closingMatch = afterOpen.match(/^([\s\S]*?)```(?:\s*$|\n)/m)

      if (!closingMatch) {
        // Genuinely unclosed — truncate
        textToParse = raw.substring(0, unclosedIdx)
        pendingVisual = true
      }
    }
  }

  // Split on complete visual fences
  const blocks: Block[] = []
  let lastIndex = 0

  const regex = new RegExp(COMPLETE_FENCE_RE.source, 'g')
  let match: RegExpExecArray | null

  while ((match = regex.exec(textToParse)) !== null) {
    const lang = match[1] as 'svg' | 'html'
    const content = match[2]

    // Add preceding text as a TextBlock
    if (match.index > lastIndex) {
      const text = textToParse.substring(lastIndex, match.index)
      if (text.trim()) {
        blocks.push({ type: 'text', content: text })
      }
    }

    // Add visual block if non-empty
    if (content.trim()) {
      blocks.push({ type: 'visual', lang, content: content.trim() })
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after last fence
  if (lastIndex < textToParse.length) {
    const remaining = textToParse.substring(lastIndex)
    if (remaining.trim()) {
      blocks.push({ type: 'text', content: remaining })
    }
  }

  // If no visual fences found at all, return single text block
  if (blocks.length === 0 && textToParse.trim()) {
    blocks.push({ type: 'text', content: textToParse })
  }

  return { blocks, pendingVisual }
}
