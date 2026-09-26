'use client'
import { SessionProvider } from 'next-auth/react'

// Client-side session only; do NOT call auth() in the root layout (would make every page dynamic).
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
