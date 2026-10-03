/**
 * Pure decision logic for a scan: which repos to fetch, whether the caller is
 * rate-limited, and which fetched releases are new. Kept free of I/O so it can
 * be unit-tested.
 */
import { SCAN_COOLDOWN_MS } from '../lib/jobs'
import type { Repo } from '../schemas/repos-schema'

export const FIRST_IMPORT_COUNT = 3

export interface StoredRecord<T> {
  recordId: string
  data: T
}

export const repoSlug = (r: Pick<Repo, 'owner' | 'name'>) => `${r.owner}/${r.name}`

export type ScanPlan =
  | { kind: 'rate-limited'; retryInSec: number }
  | {
      kind: 'scan'
      slugs: string[]
      /** Whose repo rows get last_scanned_at stamped: everyone's (cron) or just the caller's. */
      stampFor: 'all' | string
      /** Cron runs also drop followers from releases of repos nobody follows any more. */
      fullSweep: boolean
    }

/**
 * `enqueuedBy` is set from the verified JWT for client enqueues and by
 * followRepo; it is absent only for cron. `payloadSlug` comes from the
 * client, so it is only trusted after matching one of the caller's repos.
 */
export function planScan(
  enqueuedBy: string | null | undefined,
  payloadSlug: string | undefined,
  repos: StoredRecord<Repo>[],
  now: number,
): ScanPlan {
  if (!enqueuedBy) {
    const slugs = [...new Set(repos.map((r) => repoSlug(r.data)))]
    return { kind: 'scan', slugs, stampFor: 'all', fullSweep: true }
  }

  const mine = repos.filter((r) => r.data.followed_by === enqueuedBy)
  const target = payloadSlug ? mine.filter((r) => repoSlug(r.data) === payloadSlug) : mine

  // A repo that has never been scanned (just followed) skips the cooldown;
  // it can only take this path once, so it can't be used to bypass the limit.
  const neverScanned = payloadSlug !== undefined && target.length > 0 && !target[0].data.last_scanned_at
  if (!neverScanned) {
    const lastScan = Math.max(0, ...mine.map((r) => Date.parse(r.data.last_scanned_at ?? '') || 0))
    const waitMs = lastScan + SCAN_COOLDOWN_MS - now
    if (waitMs > 0) return { kind: 'rate-limited', retryInSec: Math.ceil(waitMs / 1000) }
  }

  return { kind: 'scan', slugs: target.map((r) => repoSlug(r.data)), stampFor: enqueuedBy, fullSweep: false }
}

/** Sorted, de-duplicated follower ids per slug. */
export function followersBySlug(repos: StoredRecord<Repo>[]): Map<string, string[]> {
  const map = new Map<string, Set<string>>()
  for (const r of repos) {
    const slug = repoSlug(r.data)
    if (!map.has(slug)) map.set(slug, new Set())
    map.get(slug)!.add(r.data.followed_by)
  }
  return new Map([...map].map(([slug, ids]) => [slug, [...ids].sort()]))
}

export interface FetchedRelease {
  tag: string
  published_at: string
  notes: string
}

/**
 * Releases to store: everything newer than the newest one we already have.
 * On a repo's first scan, only the latest few, so following a busy repo
 * doesn't summarize its whole history. Input must be newest-first.
 */
export function selectNewReleases(
  fetched: FetchedRelease[],
  stored: { tag: string; published_at: string }[],
): FetchedRelease[] {
  if (stored.length === 0) return fetched.slice(0, FIRST_IMPORT_COUNT)
  const known = new Set(stored.map((r) => r.tag))
  const newest = stored.reduce((max, r) => (r.published_at > max ? r.published_at : max), '')
  return fetched.filter((r) => !known.has(r.tag) && r.published_at > newest)
}

export function sameIds(a: unknown, b: string[]): boolean {
  return Array.isArray(a) && a.length === b.length && [...a].sort().every((id, i) => id === b[i])
}
