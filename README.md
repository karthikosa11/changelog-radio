# Changelog Radio

Follow public GitHub repos and get a three-line AI summary of every new release: what changed, whether it's breaking, and whether to upgrade now. Summaries appear in a live feed.

Live: https://changelog-radio.app.space

Built on the [DeepSpace SDK](https://docs.deep.space) as a timeboxed build exercise.

## How it works

1. You follow a repo (`owner/name` or a GitHub URL). A server action checks the 10-repo cap, creates the record, and queues a scan.
2. The `scan-releases` background job fetches releases from GitHub, stores new ones as `pending`, and queues one `summarize-release` job per release.
3. `summarize-release` calls Claude Haiku with the release notes and writes back a three-sentence summary.
4. The feed updates live over DeepSpace's record sync. No polling.
5. A cron task queues a scan for every followed repo every 30 minutes.

## DeepSpace features used

- **Auth**: scaffold `AuthGate`, no custom login
- **Records + permissions**: users read only their own `repos`; `releases` are shared with followers via a collaborators field, so each release is fetched and summarized once regardless of follower count
- **Server action** (`followRepo`): enforces the repo cap server-side; client `create` is disabled
- **Background jobs**: `scan-releases` and `summarize-release`, with retries and live status
- **Cron**: `scan-all` every 30 minutes
- **Realtime sync**: `useQuery` on `releases`
- **AI**: `createDeepSpaceAI` + `generateText`, owner-billed
- **Secrets**: `GITHUB_TOKEN`
- **Testing**: unit tests, multi-user Playwright specs, and a live smoke test in `tests/live/`

One custom call: GitHub's releases endpoint, because the built-in GitHub integration doesn't expose releases.

## Design decisions

- First follow imports only the latest 3 releases, to cap AI spend.
- Manual "Scan now" is rate-limited to once per 60 seconds per user. Cron runs are never throttled.
- `summarize-release` refuses jobs queued by clients, so users can't spend owner credits directly.
- Job payloads carry only record IDs, so one user can't see which repos another follows.
- Drafts are skipped; prereleases are kept.

## Run it

```bash
npm install
npx deepspace auth login
npx deepspace secrets set GITHUB_TOKEN=<fine-grained token, public repos read-only>
npx deepspace dev start
```

Tests: `npm run type-check`, `npm test`, `npx deepspace test run`.
Live smoke test: `LIVE_URL=https://changelog-radio.app.space npx playwright test -c tests/live/live.config.ts`

## Known edges

- Some summaries contain literal markdown backticks; a prompt tweak would fix it.
- Monorepos mix packages in one feed (e.g. `create-vite` inside `vitejs/vite`).
- Unfollowing revokes release access at the next cron sweep; the feed hides them immediately.
- Settings page is still the scaffold's version.

## Next steps

- Email digest of new summaries via the Resend integration
- Per-package filtering for monorepos
- Validate that a repo exists at follow time