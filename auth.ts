import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { applyProfileToToken, applyTokenToSession } from '@/lib/auth/shared'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    jwt: ({ token, profile }) => applyProfileToToken(token, profile),
    session: ({ session, token }) => applyTokenToSession(session, token),
  },
})
