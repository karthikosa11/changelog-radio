/**
 * Cron task definitions — registered into the AppCronRoom DO at construction
 * time (worker.ts). The DO alarm fires `runTask(name, env)` on the schedule
 * declared here; the DO itself records executions, tracks history, and
 * pushes status to admin clients via the `/ws/cron/:roomId` WebSocket.
 *
 * Each task declares EITHER `intervalMinutes` (run every N minutes) OR
 * `schedule` + `timezone` (5-field cron expression). CronRoom validates
 * the config at construction time and throws on ambiguous declarations.
 *
 * Example:
 *
 *   import type { CronTask } from 'deepspace/worker'
 *   import { buildCronContext } from 'deepspace/worker'
 *
 *   export const tasks: CronTask[] = [
 *     { name: 'heartbeat', intervalMinutes: 1 },
 *     { name: 'daily-report', schedule: '0 9 * * *', timezone: 'America/New_York' },
 *   ]
 *
 *   export async function runTask(name: string, env: Env): Promise<void> {
 *     const ctx = buildCronContext(env, env.OWNER_USER_ID, `app:${env.DEEPSPACE_APP_ID}`)
 *     if (name === 'heartbeat') {
 *       // …
 *     }
 *   }
 */

import { enqueueJob, type CronTask } from 'deepspace/worker'
import type { Env } from '../worker'
import { SCAN_RELEASES } from './lib/jobs'

export const tasks: CronTask[] = [{ name: 'scan-all', intervalMinutes: 30 }]

export async function runTask(name: string, env: Env): Promise<void> {
  if (name === 'scan-all') {
    // The cron only enqueues; the job does the work, so scheduled and
    // on-demand scans share one code path, retries and live status.
    // No enqueuedBy, which is how the job knows to scan every repo.
    await enqueueJob(env.JOB_ROOMS, `app:${env.DEEPSPACE_APP_ID}`, SCAN_RELEASES, {}, { maxAttempts: 2 })
    return
  }
  throw new Error(`Unknown cron task: ${name}`)
}
