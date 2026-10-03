import type { CollectionSchema } from 'deepspace/schema'

export type ReleaseStatus = 'pending' | 'ready' | 'failed'

/** One row per GitHub release, shared by every follower of the repo. */
export interface Release {
  /** "owner/name", lowercase. */
  repo: string
  tag: string
  published_at: string
  raw_notes: string
  summary?: string
  status: ReleaseStatus
  /** User ids currently following `repo`; maintained by the scan job. */
  follower_ids: string[]
}

export const releasesSchema: CollectionSchema = {
  name: 'releases',
  columns: [
    { name: 'repo', storage: 'text', interpretation: 'plain', required: true },
    { name: 'tag', storage: 'text', interpretation: 'plain', required: true },
    { name: 'published_at', storage: 'text', interpretation: { kind: 'datetime' } },
    { name: 'raw_notes', storage: 'text', interpretation: 'plain' },
    { name: 'summary', storage: 'text', interpretation: 'plain' },
    {
      name: 'status',
      storage: 'text',
      interpretation: { kind: 'select', options: ['pending', 'ready', 'failed'] },
      default: 'pending',
    },
    { name: 'follower_ids', storage: 'text', interpretation: { kind: 'json' }, default: [] },
  ],
  uniqueOn: ['repo', 'tag'],
  // 'shared' read = owner (the app, which writes these) or a listed follower.
  collaboratorsField: 'follower_ids',
  // Only background jobs write releases, and they bypass RBAC.
  permissions: {
    member: { read: 'shared', create: false, update: false, delete: false },
    admin: { read: true, create: false, update: false, delete: true },
  },
}
