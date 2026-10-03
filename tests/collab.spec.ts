/**
 * Multi-user collaboration spec — verifies two users sign in into
 * separate browser contexts and the app distinguishes them.
 *
 * `users(2)` takes any two accounts from your pool, so this spec passes on a
 * fresh app with no setup beyond having two test accounts:
 *   npx deepspace test accounts list
 *   npx deepspace test accounts create --email a@deepspace.test --name "A" --password-stdin
 *
 * Ask for accounts *by name* (`users(['Alice', 'Bob'])`) only when the
 * behaviour under test depends on which identity acts — otherwise naming them
 * couples the spec to one machine's pool.
 *
 * The `users` fixture handles sign-in caching (per-account storageState
 * persisted to `~/.deepspace/playwright-states/`), context creation, and
 * cleanup. No need to manage browser contexts manually.
 */
import { test, expect, loadAllTestAccounts } from 'deepspace/testing'
import { follow, unfollowAll } from './helpers/feed'

// A machine that has never created test accounts is the normal state of a
// fresh checkout, and there `users()` throws — turning "you have no pool yet"
// into three red tests about the app, which it is not. Skip the file instead
// and say what creates the pool. The count is of accounts usable HERE: the
// pool is global per developer, but passwords live only on the machine that
// created the account.
const usableTestAccounts = loadAllTestAccounts().length
test.skip(
  usableTestAccounts < 2,
  `Needs 2 usable test accounts, found ${usableTestAccounts}. Create them with ` +
    '`npx deepspace test accounts create --email <name>@deepspace.test --name "<name>" ' +
    '--password-stdin`, or fetch existing pool accounts with `npx deepspace test accounts recover --all`.',
)

test('each browser renders its own signed-in account', async ({ users }) => {
  const [a, b] = await users(2)

  // /home is dynamic (under src/pages/(app)/), so it mounts the nav shell;
  // '/' is the static landing and has no navigation.
  await Promise.all([a.page.goto('/home'), b.page.goto('/home')])

  // Email, not name. The page renders the *session's* `name || email`, while
  // `user.name` here comes from the LOCAL account registry — and the two are
  // not the same fact: a display name is optional, and an account recovered on
  // another machine has none stored locally at all. The email is the credential
  // the context signed in with, so it is the one identity both sides agree on,
  // and asserting it proves the page is showing THIS browser's account.
  // The two accounts are distinct, so two exact matches is also the proof that
  // the contexts are not sharing one session.
  for (const user of [a, b]) {
    await expect(user.page.getByTestId('app-navigation')).toBeVisible({ timeout: 15_000 })

    // The identity chip shows `name || email`. Its text is not predictable, but
    // its presence is: something must be there once the profile has loaded.
    // (It is `hidden sm:inline` in some templates, so assert text, not
    // visibility.)
    await expect(user.page.getByTestId('nav-user-name')).toHaveText(/\S/, { timeout: 15_000 })

    await user.page.getByRole('button', { name: 'Account menu' }).click()
    await expect(user.page.getByTestId('nav-user-email')).toHaveText(user.email, {
      timeout: 15_000,
    })
  }
})

/**
 * Permissions across two real users. Asserts on data-received (records the
 * server actually sent), not only on rendered cards, because the feed also
 * filters client-side and would hide a server-side leak.
 */
test('repos are private and releases reach only their followers', async ({ users }) => {
  const [alice, bob] = await users(['Alice', 'Bob'])
  const feed = (p: typeof alice.page) => p.getByTestId('release-feed')
  await Promise.all([alice.page.goto('/feed'), bob.page.goto('/feed')])
  await Promise.all([unfollowAll(alice.page), unfollowAll(bob.page)])

  try {
    await follow(alice.page, 'vitejs/vite')
    // Alice's follow scan also recomputes follower_ids, removing Bob from earlier runs.
    await expect(alice.page.getByTestId('release-row').first()).toBeVisible({ timeout: 30000 })

    // Bob: none of Alice's repos, and the server sends him no releases at all.
    await expect(bob.page.getByTestId('repo-row')).toHaveCount(0)
    await expect(feed(bob.page)).toHaveAttribute('data-received', '0', { timeout: 15000 })

    // Once Bob follows the same repo, the shared release rows reach him live.
    await follow(bob.page, 'vitejs/vite')
    await expect(bob.page.getByTestId('release-row').first()).toBeVisible({ timeout: 30000 })
    await expect(alice.page.getByTestId('repo-row')).toHaveCount(1)

    // Alice unfollowing removes her own copy of the follow, not Bob's.
    await unfollowAll(alice.page)
    await expect(alice.page.getByTestId('release-row')).toHaveCount(0)
    await expect(bob.page.getByTestId('release-row').first()).toBeVisible()
  } finally {
    await Promise.all([unfollowAll(alice.page), unfollowAll(bob.page)])
  }
})
