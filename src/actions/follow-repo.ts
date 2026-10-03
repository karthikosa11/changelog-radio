import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'
import { parseRepoSlug } from '../lib/repo-slug'
import { MAX_FOLLOWED_REPOS, type Repo } from '../schemas/repos-schema'

/**
 * Follow a GitHub repo for the calling user.
 *
 * This is an action rather than a client `create` because a schema can't
 * express "at most N rows per user". Tools here bypass RBAC, so every query
 * is scoped to `userId` explicitly.
 */
export const followRepo: ActionHandler<Env> = async ({ userId, params, tools }) => {
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
  return tools.create('repos', { owner: slug.owner, name: slug.name })
}
