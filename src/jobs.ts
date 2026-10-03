/**
 * Background-job handler — invoked by AppJobRoom (worker.ts) for every
 * job picked up from the queue. Dispatch on `job.type` and return a
 * result (captured as `job.result`) or throw to fail (retried up to
 * `maxAttempts`, then permanently marked failed).
 *
 * Use this for any work that needs to outlive the HTTP response:
 *   - AI generation that exceeds Cloudflare's 30-second waitUntil window
 *   - Export / render pipelines
 *   - Bulk imports, fan-out side effects
 *
 * Enqueue from a client with the `useJobs(roomId)` hook, or from
 * worker-side code (an HTTP route, an action, a cron task) with
 * `enqueueJob(env.JOB_ROOMS, \`app:${env.DEEPSPACE_APP_ID}\`, type, payload)`.
 *
 * Long-running progress / checkpoint guidance:
 *   - `ctx.progress(0..1, msg?)` publishes a real-time update over the
 *     room's WebSocket so subscribers see progress without polling.
 *   - `ctx.continue(state, { afterMs })` yields and resumes on the next
 *     alarm with `job.resumeFrom = state` — use this for work that
 *     exceeds the 15-minute per-alarm wall-time ceiling.
 *   - `ctx.signal` is an AbortSignal that fires when a client cancels;
 *     forward it to `fetch` and check `.aborted` at loop suspension
 *     points.
 *
 * Example:
 *
 *   export async function runJob(job: Job, ctx: JobContext, env: Env) {
 *     switch (job.type) {
 *       case 'ai-summarize': {
 *         const { text } = job.payload as { text: string }
 *         ctx.progress(0.1, 'starting')
 *         const summary = await summarize(text, { signal: ctx.signal })
 *         return { summary }
 *       }
 *       default:
 *         throw new Error(`Unknown job type: ${job.type}`)
 *     }
 *   }
 */

import type { Job, JobContext } from 'deepspace/worker'
import type { Env } from '../worker'
import { SCAN_RELEASES, SUMMARIZE_RELEASE, type ScanPayload, type SummarizePayload } from './lib/jobs'
import { scanReleases } from './jobs/scan-releases'
import { summarizeRelease } from './jobs/summarize-release'

/** AppJobRoom.enqueue, passed in so jobs can chain without a round trip to their own room. */
export type Enqueue = (type: string, payload: unknown, options?: { maxAttempts?: number }) => void

export async function runJob(job: Job, ctx: JobContext, env: Env, enqueue: Enqueue): Promise<unknown> {
  switch (job.type) {
    case SCAN_RELEASES:
      return scanReleases(job as Job<ScanPayload>, ctx, env, enqueue)
    case SUMMARIZE_RELEASE:
      return summarizeRelease(job as Job<SummarizePayload>, ctx, env)
    default:
      // Clients can enqueue any type string, so unknown types must fail loudly.
      throw new Error(`Unknown job type: ${job.type}`)
  }
}
