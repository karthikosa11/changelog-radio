/**
 * Job types and results shared by the worker and the UI. No worker imports
 * here, so the client bundle can use it.
 *
 * Job rows are broadcast to every connected member, so results carry counts
 * only — never repo names or user ids.
 */
export const SCAN_RELEASES = 'scan-releases'

export interface ScanPayload {
  /** Scan just this "owner/name" (used right after a follow). Omit for all of the caller's repos. */
  slug?: string
}

export type ScanResult =
  | { rateLimited: true; retryInSec: number }
  | { rateLimited: false; repos: number; newReleases: number; failedRepos: number }

export const SCAN_COOLDOWN_MS = 60_000
