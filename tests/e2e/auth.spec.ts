import { expect, test } from '@playwright/test'

test('logged-out /portfolio redirects to login', async ({ page }) => {
  await page.goto('/portfolio')

  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fportfolio$/)
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
})

test('login shows error message when Auth.js reports an error', async ({ page }) => {
  await page.goto('/login?error=OAuthCallbackError')

  await expect(page.getByRole('alert').filter({ hasText: 'Sign-in failed' })).toHaveText(
    'Sign-in failed, please try again.',
  )
})

test('home stays public and shows Sign in', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
})
