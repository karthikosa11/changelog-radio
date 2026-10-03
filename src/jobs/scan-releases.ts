/**
 * scan-releases job: fetch new GitHub releases for followed repos and store
 * them as `pending`. Enqueued by Scan now (client), followRepo (one slug) and
 * the scan-all cron task (every repo).
 */
import type { Job, JobContext } from 'deepspace/worker'
import type { Env } from '../../worker'
import type { ScanPayload, ScanResult } from '../lib/jobs'
import type { Release } from '../schemas/releases-schema'
import type { Repo } from '../schemas/repos-schema'
import { appRecords, type AppRecords } from './app-records'
import { fetchReleases, GitHubError } from './github'
import { followersBySlug, planScan, repoSlug, sameIds, selectNewReleases } from './scan-plan'

export async function scanReleases(job: Job<ScanPayload>, ctx: JobContext, env: Env): Promise<ScanResult> {
  const store = appRecords(env)
  const repos = await store.query<Repo>('repos')
  const plan = planScan(job.enqueuedBy, job.payload?.slug, repos, Date.now())
  if (plan.kind === 'rate-limited') return { rateLimited: true, retryInSec: plan.retryInSec }

  const followers = followersBySlug(repos)
  const scannedAt = new Date().toISOString()
  let newReleases = 0
  let failedRepos = 0

  for (const [i, slug] of plan.slugs.entries()) {
    ctx.progress(i / plan.slugs.length, `repo ${i + 1} of ${plan.slugs.length}`)
    try {
      const { added, newestTag } = await scanRepo(slug, followers.get(slug) ?? [], store, env, ctx.signal)
      newReleases += added
      await stampRepos(store, repos, slug, newestTag, plan.stampFor, scannedAt)
    } catch (err) {
      // One bad repo (deleted, renamed) shouldn't fail the whole scan.
      // Rate limits and outages are rethrown so the job retries.
      if (err instanceof GitHubError && !err.retryable) {
        console.warn(`[scan] ${err.message}`)
        failedRepos++
        continue
      }
      throw err
    }
  }

  if (plan.fullSweep) await dropStaleFollowers(store, followers)

  return { rateLimited: false, repos: plan.slugs.length, newReleases, failedRepos }
}

async function scanRepo(
  slug: string,
  followerIds: string[],
  store: AppRecords,
  env: Env,
  signal: AbortSignal,
): Promise<{ added: number; newestTag: string | undefined }> {
  const fetched = await fetchReleases(slug, env.GITHUB_TOKEN, signal)
  const stored = await store.query<Release>('releases', { repo: slug })

  let added = 0
  for (const r of selectNewReleases(fetched, stored.map((s) => s.data))) {
    try {
      await store.create('releases', {
        repo: slug,
        tag: r.tag,
        published_at: r.published_at,
        raw_notes: r.notes,
        status: 'pending',
        follower_ids: followerIds,
      })
      added++
    } catch (err) {
      // uniqueOn(repo, tag): a concurrent scan already stored it.
      if (!String(err).includes('Duplicate')) throw err
    }
  }

  // Keep read access in step with who follows the repo right now.
  for (const s of stored) {
    if (!sameIds(s.data.follower_ids, followerIds)) {
      await store.update('releases', s.recordId, { follower_ids: followerIds })
    }
  }

  return { added, newestTag: fetched[0]?.tag }
}

async function stampRepos(
  store: AppRecords,
  repos: { recordId: string; data: Repo }[],
  slug: string,
  newestTag: string | undefined,
  stampFor: string,
  scannedAt: string,
) {
  for (const r of repos) {
    if (repoSlug(r.data) !== slug) continue
    const patch: Partial<Repo> = {}
    if (newestTag && r.data.last_checked_tag !== newestTag) patch.last_checked_tag = newestTag
    // Only the caller's rows count toward their Scan-now cooldown.
    if (stampFor === 'all' || r.data.followed_by === stampFor) patch.last_scanned_at = scannedAt
    if (Object.keys(patch).length) await store.update('repos', r.recordId, patch)
  }
}

/** Releases of repos nobody follows any more lose their readers. */
async function dropStaleFollowers(store: AppRecords, followers: Map<string, string[]>) {
  const all = await store.query<Release>('releases')
  for (const r of all) {
    if (!followers.has(r.data.repo) && !sameIds(r.data.follower_ids, [])) {
      await store.update('releases', r.recordId, { follower_ids: [] })
    }
  }
}
