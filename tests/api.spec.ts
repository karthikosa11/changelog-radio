import { test, expect } from '@playwright/test'
import { test as signedInTest } from 'deepspace/testing'

test.describe('API tests', () => {
  test('auth proxy forwards to auth worker', async ({ request }) => {
    const res = await request.get('/api/auth/ok')
    expect(res.ok()).toBeTruthy()
  })

  test('WebSocket endpoint exists', async ({ page }) => {
    // /home is a dynamic page (under src/pages/(app)/), so mounting it boots
    // the providers and auto-connects the records WebSocket. The static
    // landing at '/' deliberately does neither — see smoke.spec.ts.
    await page.goto('/home')
    // Wait for the app to connect its WebSocket (it auto-connects on mount)
    await page.waitForSelector('[data-testid="app-navigation"]', { timeout: 15000 })
    // If the app loaded and connected, the WS endpoint works
  })
})

test.describe('followRepo action', () => {
  test('rejects unauthenticated callers', async ({ request }) => {
    const res = await request.post('/api/actions/followRepo', { data: { repo: 'vitejs/vite' } })
    expect(res.status()).toBe(401)
  })

  // Write-free on purpose: the success, duplicate and 10-repo-cap paths need
  // the unfollow UI for cleanup and are covered in smoke.spec.ts.
  signedInTest('rejects input that is not a GitHub repo', async ({ users }) => {
    const [alice] = await users(1)
    await alice.page.goto('/home')
    await expect(alice.page.getByTestId('nav-user-name')).toBeVisible({ timeout: 15000 })

    const body = await alice.page.evaluate(async () => {
      const tokenRes = await fetch('/api/auth/token', { method: 'POST', credentials: 'include' })
      const { token } = (await tokenRes.json()) as { token: string }
      const res = await fetch('/api/actions/followRepo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ repo: 'not a repo' }),
      })
      return res.json()
    })
    expect(body).toMatchObject({ success: false, error: expect.stringContaining('owner/name') })
  })
})
