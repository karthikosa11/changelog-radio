/**
 * Job types and results shared by the worker and the UI. No worker imports
 * here, so the client bundle can use it.
 *
 * Job rows (type, payload, result, enqueuedBy) are broadcast to every
 * connected member, so payloads carry opaque record ids and results carry
 * counts only — never repo names.
 */
export const SCAN_RELEASES = 'scan-releases'
export const SUMMARIZE_RELEASE = 'summarize-release'

export interface ScanPayload {
  /** Scan just this repos record (used right after a follow). Omit for all of the caller's repos. */
  repoId?: string
}

export type ScanResult =
  | { rateLimited: true; retryInSec: number }
  | { rateLimited: false; repos: number; newReleases: number; failedRepos: number }

export interface SummarizePayload {
  releaseId: string
}

export const SCAN_COOLDOWN_MS = 60_000
