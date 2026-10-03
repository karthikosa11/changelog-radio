/**
 * summarize-release job: write the AI summary for one pending release.
 * Enqueued only by scan-releases, one job per release, so each summary
 * retries on its own.
 */
import type { Job, JobContext } from 'deepspace/worker'
import type { Env } from '../../worker'
import type { SummarizePayload } from '../lib/jobs'
import type { Release } from '../schemas/releases-schema'
import { appRecords } from './app-records'
import { writeSummary } from './summarize'

type SummarizeResult = { status: 'ready' | 'skipped' }

export async function summarizeRelease(
  job: Job<SummarizePayload>,
  ctx: JobContext,
  env: Env,
): Promise<SummarizeResult> {
  // Clients can enqueue any job type. This one spends the owner's AI credits,
  // so it only runs when another job enqueued it (no enqueuedBy).
  if (job.enqueuedBy) throw new Error('summarize-release can only be enqueued by the server')

  const store = appRecords(env)
  const [release] = await store.query<Release>('releases', { recordId: job.payload.releaseId })
  // Already done, e.g. a duplicate job from a later scan: don't pay twice.
  if (!release || release.data.status !== 'pending') return { status: 'skipped' }

  try {
    const summary = await writeSummary(
      env,
      { repo: release.data.repo, tag: release.data.tag, notes: release.data.raw_notes ?? '' },
      ctx.signal,
    )
    await store.update('releases', release.recordId, { summary, status: 'ready' })
    return { status: 'ready' }
  } catch (err) {
    // Mark failed only on the last attempt, so the card keeps saying
    // "summarizing" while retries are still coming.
    if (job.attempts >= job.maxAttempts) {
      await store.update('releases', release.recordId, { status: 'failed' })
    }
    throw err
  }
}
