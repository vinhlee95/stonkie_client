import { NextRequest } from 'next/server'
import { streamFromBackend } from '../proxy'

// Answers can include a news search plus a long LLM stream.
export const maxDuration = 60

export async function POST(request: NextRequest) {
  return streamFromBackend('/api/me/portfolio/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: await request.text(),
    // Closing the chat aborts the backend request too, so it stops generating.
    signal: request.signal,
  })
}
