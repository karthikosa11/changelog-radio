import { useState, type FormEvent } from 'react'
import { Button, Input } from '@/components/ui'
import { followRepo } from '@/lib/follow-repo-client'

export function FollowRepoForm() {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setPending(true)
    const err = await followRepo(value)
    setPending(false)
    setError(err)
    if (!err) setValue('')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2" data-testid="follow-form">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="owner/repo or GitHub URL"
          aria-label="GitHub repository"
          data-testid="follow-input"
        />
        <Button type="submit" loading={pending} disabled={!value.trim()} data-testid="follow-submit">
          Follow
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive" data-testid="follow-error">
          {error}
        </p>
      )}
    </form>
  )
}
