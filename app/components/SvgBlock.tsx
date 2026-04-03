'use client'

import { useMemo } from 'react'
import DOMPurify from 'dompurify'

interface SvgBlockProps {
  content: string
}

export default function SvgBlock({ content }: SvgBlockProps) {
  const sanitized = useMemo(
    () => DOMPurify.sanitize(content, { USE_PROFILES: { svg: true } }),
    [content],
  )

  return (
    <div
      className="w-full my-4 [&_svg]:w-full [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
