import { test, expect } from '@playwright/test'
import { captureConsoleErrors } from './helpers/errors'
import { test as signedInTest } from 'deepspace/testing'
import { follow, unfollowAll } from './helpers/feed'

/**
 * Smoke tests covering both page kinds this template ships:
 *   - '/'      → the static landing (top level of src/pages/): no providers,
 *                so no auth fetch and no records WebSocket on load.
 *   - '/home'  → a dynamic page (under src/pages/(app)/): the providers mount,
 *                the nav shell renders, and the records WebSocket connects.
 *
 * The "static contract" test is the guardrail for the per-page opt-out: if
 * someone moves the providers back up into _app.tsx, it fails.
 */

/** Wait for the React app shell (present on every page). */
async function waitForApp(page: import('@playwright/test').Page) {
  await page.waitForSelector('[data-testid="app-root"]', { timeout: 15000 })
}

test.describe('Smoke tests', () => {
  test('static landing loads without JS errors', async ({ page }) => {
    const errors = captureConsoleErrors(page)
    await page.goto('/')
    await waitForApp(page)
    await expect(page.getByTestId('static-landing')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('landing carries one title, one description, one canonical', async ({ page }) => {
    // <Seo> (src/pages/index.tsx, values from src/seo.ts) hoists these into
    // <head>. Exactly one of each: index.html ships no static description or
    // canonical, because React 19 would not dedupe against them on mount.
    await page.goto('/')
    await expect(page.getByTestId('static-landing')).toBeVisible()
    await expect(page).toHaveTitle(/\S/)
    expect(await page.locator('head meta[name="description"]').count()).toBe(1)
    expect(await page.locator('head link[rel="canonical"]').count()).toBe(1)
  })

  test('static contract: landing fires no auth request, opens no websocket', async ({ page }) => {
    const offenders: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/api/auth/')) offenders.push(req.url())
    })
    // Only the DO room route counts — vite's own HMR socket is a dev artifact.
    page.on('websocket', (ws) => {
      if (new URL(ws.url()).pathname.startsWith('/ws/')) offenders.push(`ws: ${ws.url()}`)
    })
    await page.goto('/')
    await expect(page.getByTestId('static-landing')).toBeVisible()
    await page.waitForTimeout(1500)
    expect(offenders).toEqual([])
  })

  test('landing names the product, not the scaffold', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your dependencies’ releases, in three sentences.')
    await expect(page).toHaveTitle(/Changelog Radio/)
    await expect(page.getByTestId('release-row')).toHaveAttribute('data-status', 'ready')
  })

  test('signed-out /feed asks for sign-in instead of showing data', async ({ page }) => {
    await page.goto('/feed')
    await expect(page.getByText('Sign in to continue')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('release-feed')).toHaveCount(0)
  })

  test('dynamic app boundary mounts on /home', async ({ page }) => {
    await page.goto('/home')
    await expect(page.getByTestId('app-navigation')).toBeVisible({ timeout: 15000 })
  })

  test('sign-in button visible when logged out', async ({ page }) => {
    await page.goto('/home')
    await expect(page.getByTestId('nav-sign-in-button')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('nav-user-name')).toHaveCount(0)
  })

  test('unknown route shows 404', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz')
    await waitForApp(page)
    await expect(page.locator('text=404')).toBeVisible()
  })
})

/**
 * Feed flows as real signed-in users, against the real worker, job room and
 * GitHub. Each test unfollows everything in `finally`. Releases stay in the
 * local dev store (members can't delete them, by design), which is harmless:
 * re-following just re-adds the user as a follower.
 */
signedInTest.describe('Feed', () => {
  signedInTest('follow fetches releases live; Scan now is rate-limited; unfollow hides them', async ({ users }) => {
    const [carol] = await users(['Carol'])
    const page = carol.page
    await page.goto('/feed')
    await unfollowAll(page)
    try {
      await follow(page, 'vitejs/vite')
      await expect(page.getByTestId('repo-row')).toHaveCount(1)

      // followRepo enqueues a scan; rows arrive over the records WebSocket, no reload.
      const firstRelease = page.getByTestId('release-row').first()
      await expect(firstRelease).toBeVisible({ timeout: 30000 })
      await expect(firstRelease).toHaveAttribute('data-status', /pending|ready/)

      // summarize-release jobs flip each row to ready in place (real AI call on first run).
      await expect(firstRelease).toHaveAttribute('data-status', 'ready', { timeout: 60000 })
      const summary = firstRelease.getByTestId('release-summary')
      await expect(summary).not.toHaveText(/Summarizing|unavailable/)
      expect((await summary.innerText()).length).toBeGreaterThan(40)

      await follow(page, 'https://github.com/vitejs/vite')
      await expect(page.getByTestId('follow-error')).toContainText('already follow')

      // The follow scan just ran, so an immediate Scan now must be refused.
      await page.getByTestId('scan-now').click()
      await expect(page.getByTestId('scan-status')).toContainText('Try again in', { timeout: 15000 })
      await expect(page.getByTestId('scan-now')).toBeDisabled()
    } finally {
      await unfollowAll(page)
    }
    await expect(page.getByTestId('release-row')).toHaveCount(0)
  })

  signedInTest('caps follows at 10 repos', async ({ users }) => {
    const [dave] = await users(['Dave'])
    const page = dave.page
    await page.goto('/feed')
    await unfollowAll(page)
    try {
      // Nonexistent repos: following doesn't call GitHub, and their scans 404 fast.
      for (let i = 1; i <= 10; i++) {
        await follow(page, `clr-q7k2-missing/repo-${i}`)
        await expect(page.getByTestId('repo-row')).toHaveCount(i)
      }
      await follow(page, 'clr-q7k2-missing/repo-11')
      await expect(page.getByTestId('follow-error')).toContainText('up to 10')
      await expect(page.getByTestId('repo-row')).toHaveCount(10)
      // Each follow scanned a repo that doesn't exist; the status line must say so.
      await expect(page.getByTestId('scan-status')).toHaveText('Checked 1 repo, 1 not found.', { timeout: 15000 })
    } finally {
      await unfollowAll(page)
    }
  })
})
