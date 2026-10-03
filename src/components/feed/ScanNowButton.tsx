import { useEffect, useState } from 'react'
import { useAuth, useJobs } from 'deepspace'
import { Button } from '@/components/ui'
import { SCOPE_ID } from '@/constants'
import { SCAN_RELEASES, type ScanPayload, type ScanResult } from '@/lib/jobs'

export function ScanNowButton() {
  const { userId } = useAuth()
  const { jobs, enqueue, connected } = useJobs<ScanPayload, ScanResult>(SCOPE_ID)
  const [enqueueError, setEnqueueError] = useState<string | null>(null)

  // The job room broadcasts every member's jobs; show only the caller's.
  const latest = jobs.find((j) => j.type === SCAN_RELEASES && j.enqueuedBy === userId)
  const running = latest?.status === 'queued' || latest?.status === 'running'
  const limited = latest?.status === 'succeeded' && latest.result?.rateLimited ? latest.result : null
  const coolingDown = useCooldown(limited ? Date.parse(latest!.completedAt ?? '') + limited.retryInSec * 1000 : 0)

  async function scan() {
    setEnqueueError(null)
    try {
      await enqueue(SCAN_RELEASES, {}, { maxAttempts: 2 })
    } catch {
      setEnqueueError('Could not start a scan. Check your connection and try again.')
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
      <Button
        onClick={scan}
        loading={running}
        disabled={!connected || running || coolingDown}
        data-testid="scan-now"
      >
        Scan now
      </Button>
      <p className="text-xs text-muted-foreground" aria-live="polite" data-testid="scan-status">
        {enqueueError ?? statusText(latest?.status, latest?.result, latest?.error, latest?.progressMessage)}
      </p>
    </div>
  )
}

function statusText(
  status: string | undefined,
  result: ScanResult | undefined,
  error: string | undefined,
  progress: string | undefined,
): string {
  switch (status) {
    case 'queued':
      return 'Scan queued…'
    case 'running':
      return progress ? `Scanning ${progress}…` : 'Scanning…'
    case 'failed':
      return `Scan failed: ${error ?? 'unknown error'}`
    case 'succeeded':
      if (!result) return 'Scan finished.'
      if (result.rateLimited) return `Scanned recently. Try again in ${result.retryInSec}s.`
      return `Checked ${result.repos} repo${result.repos === 1 ? '' : 's'}, ${result.newReleases} new release${result.newReleases === 1 ? '' : 's'}${result.failedRepos ? `, ${result.failedRepos} not found` : ''}.`
    default:
      return 'Checks GitHub for new releases.'
  }
}

/** True until `until` (epoch ms); re-renders once when the cooldown ends. */
function useCooldown(until: number): boolean {
  const [, setTick] = useState(0)
  useEffect(() => {
    const ms = until - Date.now()
    if (ms <= 0) return
    const t = setTimeout(() => setTick((n) => n + 1), ms)
    return () => clearTimeout(t)
  }, [until])
  return until > Date.now()
}
