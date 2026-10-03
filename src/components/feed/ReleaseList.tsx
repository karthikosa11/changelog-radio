import { useAuth, useQuery } from 'deepspace'
import { Badge } from '@/components/ui'
import type { Release } from '@/schemas/releases-schema'

/** Live list of releases the user can read. Minimal for now; cards come with the AI summaries. */
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

  if (status === 'loading') return <p className="text-sm text-muted-foreground">Loading releases…</p>
  if (mine.length === 0) {
    return <p className="text-sm text-muted-foreground">No releases yet. Follow a repo, then scan.</p>
  }

  return (
    <ul className="space-y-2" data-testid="release-list">
      {mine.map((r) => (
        <li
          key={r.recordId}
          className="space-y-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          data-testid="release-row"
          data-status={r.data.status}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-foreground">
              {r.data.repo} <span className="text-muted-foreground">{r.data.tag}</span>
            </span>
            <span className="flex items-center gap-2">
              <time className="text-xs text-muted-foreground" dateTime={r.data.published_at}>
                {new Date(r.data.published_at).toLocaleDateString()}
              </time>
              <Badge variant="outline" size="sm">
                {r.data.status}
              </Badge>
            </span>
          </div>
          <p className="text-muted-foreground" data-testid="release-summary">
            {summaryText(r.data)}
          </p>
        </li>
      ))}
    </ul>
  )
}

function summaryText(release: Release): string {
  if (release.status === 'ready') return release.summary ?? ''
  if (release.status === 'failed') return 'Summary unavailable for this release.'
  return 'Summarizing…'
}
