/**
 * Strips inline source references from answer text.
 * Handles both legacy [Sources: ...] and new [SOURCES_JSON]...[/SOURCES_JSON] formats.
 */
export function stripSourceReferences(text: string): string {
  return (
    text
      // New format: [SOURCES_JSON]....[/SOURCES_JSON] blocks
      .replace(/\[SOURCES_JSON\][\s\S]*?\[\/SOURCES_JSON\]/g, '')
      // Legacy: [Sources: [name](url)] → extract the inner markdown link
      .replace(/\[Sources?:\s*(\[[^\]]+\]\([^)]+\))\s*\]/gi, '$1')
      // Legacy: [Sources: id] plain references (no nested link)
      .replace(/\[Sources?:\s*[^\]]*\]/gi, '')
      // Unwrap ( ...markdown links... ) or ( ...markdown links... )]
      .replace(/\(\s*(\[[^\]]+\]\([^)]+\)(?:\s*,\s*\[[^\]]+\]\([^)]+\))*)\s*\)\]?/g, '$1')
  )
}
