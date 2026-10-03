import { expect, type Page } from '@playwright/test'

/** Follow a repo through the real form and wait for the followRepo action to answer. */
export async function follow(page: Page, repo: string) {
  await page.getByTestId('follow-input').fill(repo)
  const done = page.waitForResponse((res) => res.url().endsWith('/api/actions/followRepo'))
  await page.getByTestId('follow-submit').click()
  await done
}

/** Unfollow every repo through the UI, confirming each dialog. Used for test cleanup. */
export async function unfollowAll(page: Page) {
  // "No skeleton" is also true before the page mounts, so wait for the form first.
  await expect(page.getByTestId('follow-form')).toBeVisible({ timeout: 15000 })
  await expect(page.getByLabel('Loading repos')).toHaveCount(0, { timeout: 15000 })
  // Row buttons are labelled "Unfollow owner/name"; the dialog's confirm button is just "Unfollow".
  const rowButtons = page.getByRole('button', { name: /^Unfollow \S/ })
  for (let n = await rowButtons.count(); n > 0; n--) {
    await rowButtons.first().click()
    await page.getByRole('dialog').getByRole('button', { name: 'Unfollow', exact: true }).click()
    await expect(rowButtons).toHaveCount(n - 1)
  }
}
