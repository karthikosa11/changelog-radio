/**
 * Home skeleton: data-forward. The feed is the product, so it is the first
 * thing a signed-in user sees, with the repo list beside it.
 * Gated by (protected)/_layout.tsx.
 */
import { useAuth, useQuery } from 'deepspace'
import { FollowRepoForm } from '@/components/feed/FollowRepoForm'
import { ReleaseList } from '@/components/feed/ReleaseList'
import { RepoList } from '@/components/feed/RepoList'
import { ScanNowButton } from '@/components/feed/ScanNowButton'
import type { Repo } from '@/schemas/repos-schema'

export default function FeedPage() {
  const { userId } = useAuth()
  // One subscription shared by the repo list and the feed filter.
  // `where` matters for the app owner: admins can read every user's repos.
  const repos = useQuery<Repo>('repos', { where: { followed_by: userId ?? '' } })
  const followed = new Set(repos.records.map((r) => `${r.data.owner}/${r.data.name}`))

  return (
    <div className="min-h-full text-foreground">
      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-10 md:grid-cols-[17rem_1fr]">
        <aside className="space-y-4 md:sticky md:top-6 md:self-start">
          <h2 className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Following</h2>
          <FollowRepoForm />
          <RepoList repos={repos.records} loading={repos.status === 'loading'} />
        </aside>
        <main className="min-w-0 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">Releases</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                New releases from the repos you follow, newest first. Checked every 30 minutes.
              </p>
            </div>
            <ScanNowButton />
          </div>
          <ReleaseList followed={followed} />
        </main>
      </div>
    </div>
  )
}
