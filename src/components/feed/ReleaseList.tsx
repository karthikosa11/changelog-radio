import { useAuth, useQuery } from 'deepspace'
import { Radio } from 'lucide-react'
import { EmptyState } from '@/components/ui'
import type { Release } from '@/schemas/releases-schema'
import { ReleaseCard } from './ReleaseCard'

/** Live feed of releases for the repos the user follows, newest first. */
export function ReleaseList({ followed }: { followed: Set<string> }) {
  const { userId } = useAuth()
  const { records, status } = useQuery<Release>('releases', {
    orderBy: 'published_at',
    orderDir: 'desc',
    limit: 50,
  })
  // The server already limits members to releases listing them as a follower.
  // Filtering again covers two gaps: the app owner (admin) receives every
  // release, and after an unfollow the server drops access only at the next scan.
  const mine = records.filter(
    (r) =>
      followed.has(r.data.repo) &&
      Array.isArray(r.data.follower_ids) &&
      r.data.follower_ids.includes(userId ?? ''),
  )

  return (
    // data-received is the raw count the server sent. The two-user test reads
    // it to prove the read rule is enforced server-side, not just by `mine`.
    <div data-testid="release-feed" data-received={status === 'ready' ? records.length : undefined}>
      {status === 'loading' ? (
        <FeedSkeleton />
      ) : mine.length === 0 ? (
        <EmptyState
          icon={<Radio aria-hidden />}
          title={followed.size === 0 ? 'Nothing to read yet' : 'No releases yet'}
          description={
            followed.size === 0
              ? 'Follow a repo on the left. Its latest releases appear here within a few seconds.'
              : 'The repos you follow have no published GitHub Releases yet. New ones appear here as they ship.'
          }
          className="rounded-lg border border-dashed border-border"
        />
      ) : (
        <div className="space-y-4" data-testid="release-list">
          {mine.map((r) => (
            <ReleaseCard key={r.recordId} release={r.data} />
          ))}
        </div>
      )}
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading releases">
      {[0, 1].map((i) => (
        <div key={i} className="space-y-3 rounded-lg border border-border bg-card p-4">
          <div className="h-4 w-48 animate-pulse rounded-sm bg-muted" />
          <div className="h-3 w-full animate-pulse rounded-sm bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded-sm bg-muted" />
        </div>
      ))}
    </div>
  )
}
