import { expect, test } from 'deepspace/testing'
import { follow, unfollowAll } from '../helpers/feed'

/**
 * The core loop on the deployed app, as a user who has never used it:
 * landing -> feed -> follow -> releases arrive live -> AI summaries arrive
 * live -> Scan now is rate-limited -> unfollow empties the feed.
 *
 * Uses real GitHub and real (owner-billed) AI calls, about $0.0025 per new
 * summary. Pick a repo whose releases are already summarized to make reruns free.
 */
const REPO = process.env.LIVE_REPO ?? 'honojs/hono'

test('core loop works on the deploy for a fresh user', async ({ page: anonPage, users }) => {
  // Signed out: the static landing renders the real product.
  await anonPage.goto('/')
  await expect(anonPage.getByRole('heading', { level: 1 })).toHaveText('Your dependencies’ releases, in three sentences.')

  const [erin] = await users(['Erin'])
  const page = erin.page
  await page.goto('/feed')
  await unfollowAll(page)

  try {
    await follow(page, REPO)
    await expect(page.getByTestId('repo-row')).toHaveCount(1)

    const first = page.getByTestId('release-row').first()
    await expect(first).toBeVisible({ timeout: 45_000 })
    await expect(first).toHaveAttribute('data-status', 'ready', { timeout: 90_000 })
    await expect(first.getByTestId('release-summary')).toContainText('Breaking', { ignoreCase: true })

    await page.getByTestId('scan-now').click()
    await expect(page.getByTestId('scan-status')).toContainText('Try again in', { timeout: 20_000 })

    await page.screenshot({ path: process.env.LIVE_SHOT ?? 'test-results/live-feed.png' })
  } finally {
    await unfollowAll(page)
  }
  await expect(page.getByTestId('release-row')).toHaveCount(0)
})
