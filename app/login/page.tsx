import { redirect } from 'next/navigation'
import { auth, signIn } from '@/auth'
import { sanitizeCallbackUrl } from '@/lib/auth/callbackUrl'
import { isCompleteSessionUser } from '@/lib/auth/session'

type Props = {
  searchParams: Promise<{ callbackUrl?: string | string[]; error?: string | string[] }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl, error } = await searchParams
  const redirectTo = sanitizeCallbackUrl(callbackUrl)

  const session = await auth()
  // A partial session would bounce back here from /portfolio forever, so only redirect complete ones.
  if (isCompleteSessionUser(session?.user)) redirect(redirectTo)

  async function signInWithGoogle() {
    'use server'
    await signIn('google', { redirectTo })
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold">Sign in to Stonkie</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Track your portfolio and more.
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            Sign-in failed, please try again.
          </p>
        )}
        <form action={signInWithGoogle} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-full border border-gray-300 dark:border-white/20 py-3 font-medium hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </main>
  )
}
