import { enqueueJob, type ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'
import { SCAN_RELEASES, type ScanPayload } from '../lib/jobs'
import { formatRepoSlug, parseRepoSlug } from '../lib/repo-slug'
import { MAX_FOLLOWED_REPOS, type Repo } from '../schemas/repos-schema'

/**
 * Follow a GitHub repo for the calling user.
 *
 * This is an action rather than a client `create` because a schema can't
 * express "at most N rows per user". Tools here bypass RBAC, so every query
 * is scoped to `userId` explicitly.
 */
export const followRepo: ActionHandler<Env> = async ({ userId, params, tools, env }) => {
  const slug = parseRepoSlug(String(params.repo ?? ''))
  if (!slug) {
    return { success: false, error: 'Enter a GitHub repo as owner/name or a github.com URL.' }
  }

  const existing = await tools.query<Pick<Repo, 'owner' | 'name'>>('repos', {
    where: { followed_by: userId },
  })
  if (!existing.success) return existing
  const mine = existing.data.records

  if (mine.some((r) => r.data.owner === slug.owner && r.data.name === slug.name)) {
    return { success: false, error: `You already follow ${slug.owner}/${slug.name}.` }
  }
  if (mine.length >= MAX_FOLLOWED_REPOS) {
    return { success: false, error: `You can follow up to ${MAX_FOLLOWED_REPOS} repos. Unfollow one first.` }
  }

  // followed_by is userBound: the record room stamps the caller's id itself.
  const created = await tools.create('repos', { owner: slug.owner, name: slug.name })
  if (!created.success) return created

  // Fill the feed right away instead of waiting for Scan now or the cron.
  // The follow already succeeded, so a failed enqueue is logged, not returned.
  try {
    const payload: ScanPayload = { slug: formatRepoSlug(slug) }
    await enqueueJob(env.JOB_ROOMS, `app:${env.DEEPSPACE_APP_ID}`, SCAN_RELEASES, payload, {
      maxAttempts: 2,
      enqueuedBy: userId,
    })
  } catch (err) {
    console.error(`[followRepo] scan enqueue failed: ${String(err)}`)
  }
  return created
}
