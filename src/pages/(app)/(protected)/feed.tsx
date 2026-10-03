/**
 * The signed-in feed: follow repos, trigger a scan, see releases live.
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
      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-12 md:grid-cols-[18rem_1fr]">
        <aside className="space-y-4">
          <h2 className="text-sm font-semibold">Following</h2>
          <FollowRepoForm />
          <RepoList repos={repos.records} loading={repos.status === 'loading'} />
        </aside>
        <main className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight">Releases</h1>
            <ScanNowButton />
          </div>
          <ReleaseList followed={followed} />
        </main>
      </div>
    </div>
  )
}
