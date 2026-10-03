import { useMutations } from 'deepspace'
import { Button } from '@/components/ui'
import { MAX_FOLLOWED_REPOS, type Repo } from '@/schemas/repos-schema'

interface Props {
  repos: { recordId: string; data: Repo }[]
  loading: boolean
}

export function RepoList({ repos, loading }: Props) {
  const { remove, ready } = useMutations<Repo>('repos')

  if (loading) return <p className="text-sm text-muted-foreground">Loading repos…</p>
  if (repos.length === 0) {
    return <p className="text-sm text-muted-foreground">You are not following any repos yet.</p>
  }

  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        {repos.length} of {MAX_FOLLOWED_REPOS} repos
      </p>
      <ul className="divide-y divide-border rounded-lg border border-border" data-testid="repo-list">
        {repos.map((r) => (
          <li key={r.recordId} className="flex items-center justify-between px-3 py-2 text-sm" data-testid="repo-row">
            <span className="font-mono text-foreground">
              {r.data.owner}/{r.data.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={!ready}
              onClick={() => remove(r.recordId)}
              aria-label={`Unfollow ${r.data.owner}/${r.data.name}`}
            >
              Unfollow
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
