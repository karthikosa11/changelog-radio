import { useState } from 'react'
import { useMutations } from 'deepspace'
import { X } from 'lucide-react'
import { Button, ConfirmModal, useToast } from '@/components/ui'
import { MAX_FOLLOWED_REPOS, type Repo } from '@/schemas/repos-schema'

interface Props {
  repos: { recordId: string; data: Repo }[]
  loading: boolean
}

export function RepoList({ repos, loading }: Props) {
  const { removeConfirmed, ready } = useMutations<Repo>('repos')
  const toast = useToast()
  // `target` outlives `open` so the title keeps the repo name during the close animation.
  const [target, setTarget] = useState<{ recordId: string; slug: string } | null>(null)
  const [open, setOpen] = useState(false)
  const [removing, setRemoving] = useState(false)

  async function unfollow() {
    if (!target) return
    setRemoving(true)
    try {
      await removeConfirmed(target.recordId)
      toast.success(`Unfollowed ${target.slug}`)
      setOpen(false)
    } catch {
      toast.error(`Could not unfollow ${target.slug}`, 'Check your connection and try again.')
    } finally {
      setRemoving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading repos">
        <div className="h-9 animate-pulse rounded-md bg-muted" />
        <div className="h-9 animate-pulse rounded-md bg-muted" />
      </div>
    )
  }
  if (repos.length === 0) {
    return <p className="text-sm text-muted-foreground">You are not following any repos yet. Try vitejs/vite.</p>
  }

  return (
    <div>
      <ul className="divide-y divide-border rounded-md border border-border bg-card" data-testid="repo-list">
        {repos.map((r) => {
          const slug = `${r.data.owner}/${r.data.name}`
          return (
            <li key={r.recordId} className="flex items-center justify-between gap-2 py-1 pl-3 pr-1" data-testid="repo-row">
              <span className="truncate font-mono text-sm text-foreground">{slug}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground"
                disabled={!ready}
                onClick={() => {
                  setTarget({ recordId: r.recordId, slug })
                  setOpen(true)
                }}
                aria-label={`Unfollow ${slug}`}
              >
                <X aria-hidden />
              </Button>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        {repos.length} of {MAX_FOLLOWED_REPOS} repos
      </p>

      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={unfollow}
        loading={removing}
        title={`Unfollow ${target?.slug ?? 'repo'}?`}
        description="Its releases leave your feed. Follow it again any time."
        confirmText="Unfollow"
      />
    </div>
  )
}
