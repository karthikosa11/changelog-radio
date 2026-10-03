import { defineConfig } from '@playwright/test'

/**
 * Smoke-tests a deployed app instead of a local dev server:
 *
 *   LIVE_URL=https://changelog-radio.app.space npx playwright test -c tests/live/live.config.ts
 *
 * No webServer: the deploy is the server. Specs here end in .live.ts so the
 * normal `deepspace test run` suites never pick them up.
 */
const LIVE_URL = process.env.LIVE_URL
if (!LIVE_URL) throw new Error('Set LIVE_URL to the deployed app, e.g. https://changelog-radio.app.space')

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.live.ts',
  timeout: 120_000,
  retries: 0,
  workers: 1,
  use: { baseURL: LIVE_URL, headless: true },
})
