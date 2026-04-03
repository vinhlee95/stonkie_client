'use client'

import { useMemo } from 'react'

interface SvgBlockProps {
  content: string
}

/** Strip <script> tags and on* event attributes from SVG for safety. */
function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
}

export default function SvgBlock({ content }: SvgBlockProps) {
  const sanitized = useMemo(() => sanitizeSvg(content), [content])

  return (
    <div
      className="w-full my-4 [&_svg]:w-full [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
