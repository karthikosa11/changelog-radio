/**
 * GitHub releases fetch. Direct call because the DeepSpace `github`
 * integration has no releases endpoint. The token comes from the
 * GITHUB_TOKEN secret (`npx deepspace secrets set GITHUB_TOKEN=...`).
 */
import type { FetchedRelease } from './scan-plan'

export class GitHubError extends Error {
  constructor(
    message: string,
    /** Worth retrying the job (rate limit, GitHub outage) vs. a permanent problem (404). */
    readonly retryable: boolean,
  ) {
    super(message)
  }
}

interface GitHubReleaseJson {
  tag_name: string
  published_at: string | null
  body: string | null
  draft: boolean
}

/** Notes longer than this are cut; the summary prompt truncates further anyway. */
const MAX_NOTES_CHARS = 20_000

/** Latest published (non-draft) releases, newest first. */
export async function fetchReleases(
  slug: string,
  token: string | undefined,
  signal: AbortSignal,
): Promise<FetchedRelease[]> {
  const res = await fetch(`https://api.github.com/repos/${slug}/releases?per_page=10`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      // GitHub rejects requests without a User-Agent.
      'User-Agent': 'changelog-radio',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  })

  if (res.status === 404) throw new GitHubError(`GitHub repo ${slug} not found`, false)
  if (res.status === 403 || res.status === 429) {
    const reset = res.headers.get('x-ratelimit-reset')
    throw new GitHubError(`GitHub rate limit hit (resets at ${reset ?? 'unknown'})`, true)
  }
  if (!res.ok) throw new GitHubError(`GitHub returned ${res.status} for ${slug}`, res.status >= 500)

  const json = (await res.json()) as GitHubReleaseJson[]
  return json
    .filter((r): r is GitHubReleaseJson & { published_at: string } => !r.draft && !!r.published_at)
    .map((r) => ({ tag: r.tag_name, published_at: r.published_at, notes: (r.body ?? '').slice(0, MAX_NOTES_CHARS) }))
    .sort((a, b) => b.published_at.localeCompare(a.published_at))
}
