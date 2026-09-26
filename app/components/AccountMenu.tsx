'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { signOut, useSession } from 'next-auth/react'
import { PersonOutline } from '@mui/icons-material'

const itemClass =
  'group relative p-2.5 rounded-full text-gray-700 dark:text-gray-300 focus:outline-none transition-all duration-300 hover:scale-110 active:scale-95 z-10'
const menuItemClass =
  'block w-full text-left px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'

// Menu is portalled to <body>: the nav pill's overflow-hidden + backdrop-blur would clip it.
export default function AccountMenu() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const menuItems = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])

  useEffect(() => {
    if (open) menuItems()[0]?.focus()
  }, [open])

  const closeMenu = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  const handleMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = menuItems()
    const index = items.indexOf(document.activeElement as HTMLElement)
    // Tab also closes: the menu is portalled to <body>, so native tab order would skip past the page.
    if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault()
      closeMenu()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[(index + 1) % items.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[(index - 1 + items.length) % items.length]?.focus()
    }
  }

  if (status === 'loading') {
    return (
      <span aria-hidden className={itemClass}>
        <PersonOutline fontSize="medium" className="relative z-10 opacity-40" />
      </span>
    )
  }

  if (!session?.user) {
    const query = searchParams?.toString()
    const loginHref = `/login?${new URLSearchParams({ callbackUrl: query ? `${pathname}?${query}` : pathname })}`
    return (
      <Link href={loginHref} aria-label="Sign in" className={itemClass}>
        <PersonOutline fontSize="medium" className="relative z-10" />
      </Link>
    )
  }

  const { name, email, image } = session.user

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={itemClass}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            referrerPolicy="no-referrer"
            className="relative z-10 w-6 h-6 rounded-full"
          />
        ) : (
          <PersonOutline fontSize="medium" className="relative z-10" />
        )}
      </button>
      {open &&
        createPortal(
          <>
            <div
              data-testid="account-menu-backdrop"
              className="fixed inset-0 z-40"
              onClick={closeMenu}
              aria-hidden
            />
            <div
              ref={menuRef}
              role="menu"
              onKeyDown={handleMenuKeyDown}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-56 rounded-2xl bg-white dark:bg-[#1C1C1C] shadow-lg border border-gray-200 dark:border-white/10 py-2"
            >
              <p className="px-4 py-2 text-xs text-gray-500 truncate">{name ?? email}</p>
              <Link
                role="menuitem"
                href="/portfolio"
                onClick={() => setOpen(false)}
                className={menuItemClass}
              >
                Portfolio
              </Link>
              <button
                role="menuitem"
                type="button"
                onClick={() => signOut({ redirectTo: '/' })}
                className={menuItemClass}
              >
                Sign out
              </button>
            </div>
          </>,
          document.body,
        )}
    </>
  )
}
