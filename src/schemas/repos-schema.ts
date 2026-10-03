import type { CollectionSchema } from 'deepspace/schema'

/** One row per (user, GitHub repo) follow. Private to the follower. */
export interface Repo {
  owner: string
  name: string
  followed_by: string
  /** Newest release tag seen by the scan job; empty until the first scan. */
  last_checked_tag?: string
  /** ISO time of the last scan that covered this repo; drives the Scan-now rate limit. */
  last_scanned_at?: string
}

export const MAX_FOLLOWED_REPOS = 10

export const reposSchema: CollectionSchema = {
  name: 'repos',
  columns: [
    { name: 'owner', storage: 'text', interpretation: 'plain', required: true, immutable: true },
    { name: 'name', storage: 'text', interpretation: 'plain', required: true, immutable: true },
    // userBound: the record room stamps the writer's verified id, so it can't be spoofed.
    { name: 'followed_by', storage: 'text', interpretation: 'plain', userBound: true, immutable: true },
    { name: 'last_checked_tag', storage: 'text', interpretation: 'plain' },
    { name: 'last_scanned_at', storage: 'text', interpretation: { kind: 'datetime' } },
  ],
  ownerField: 'followed_by',
  uniqueOn: ['owner', 'name', 'followed_by'],
  // create is false for members: following goes through the followRepo action,
  // which enforces MAX_FOLLOWED_REPOS. Unfollow is a plain client delete.
  permissions: {
    member: { read: 'own', create: false, update: false, delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
