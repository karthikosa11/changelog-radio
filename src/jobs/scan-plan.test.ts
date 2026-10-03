import { describe, expect, it } from 'vitest'
import type { Repo } from '../schemas/repos-schema'
import { followersBySlug, planScan, selectNewReleases, type StoredRecord } from './scan-plan'

const NOW = Date.parse('2026-10-02T12:00:00Z')
const secondsAgo = (s: number) => new Date(NOW - s * 1000).toISOString()

function repo(id: string, slug: string, user: string, extra: Partial<Repo> = {}): StoredRecord<Repo> {
  const [owner, name] = slug.split('/')
  return { recordId: id, data: { owner, name, followed_by: user, ...extra } }
}

describe('planScan', () => {
  const repos = [
    repo('1', 'vitejs/vite', 'alice', { last_scanned_at: secondsAgo(300) }),
    repo('2', 'facebook/react', 'alice', { last_scanned_at: secondsAgo(300) }),
    repo('3', 'vitejs/vite', 'bob', { last_scanned_at: secondsAgo(10) }),
  ]

  it('cron (no enqueuedBy) scans every distinct repo with a full sweep', () => {
    expect(planScan(undefined, undefined, repos, NOW)).toEqual({
      kind: 'scan',
      slugs: ['vitejs/vite', 'facebook/react'],
      stampFor: 'all',
      fullSweep: true,
    })
  })

  it('Scan now covers only the caller\'s repos', () => {
    expect(planScan('alice', undefined, repos, NOW)).toMatchObject({
      kind: 'scan',
      slugs: ['vitejs/vite', 'facebook/react'],
      stampFor: 'alice',
      fullSweep: false,
    })
  })

  it('rate-limits a caller who scanned under 60s ago', () => {
    expect(planScan('bob', undefined, repos, NOW)).toEqual({ kind: 'rate-limited', retryInSec: 50 })
  })

  it('lets a just-followed repo through the cooldown', () => {
    const withNew = [...repos, repo('4', 'nodejs/node', 'bob')]
    expect(planScan('bob', '4', withNew, NOW)).toMatchObject({ kind: 'scan', slugs: ['nodejs/node'] })
  })

  it('does not exempt an already-scanned repo passed in the payload', () => {
    expect(planScan('bob', '3', repos, NOW)).toMatchObject({ kind: 'rate-limited' })
  })

  it('ignores a payload repo the caller does not own', () => {
    expect(planScan('alice', '3', repos, NOW)).toMatchObject({ kind: 'scan', slugs: [] })
  })
})

describe('followersBySlug', () => {
  it('groups distinct followers per repo', () => {
    const map = followersBySlug([repo('1', 'a/b', 'u2'), repo('2', 'a/b', 'u1'), repo('3', 'c/d', 'u1')])
    expect(Object.fromEntries(map)).toEqual({ 'a/b': ['u1', 'u2'], 'c/d': ['u1'] })
  })
})

describe('selectNewReleases', () => {
  const fetched = ['v5', 'v4', 'v3', 'v2', 'v1'].map((tag, i) => ({
    tag,
    published_at: `2026-09-0${5 - i}T00:00:00Z`,
    notes: '',
  }))

  it('imports only the latest 3 on a repo\'s first scan', () => {
    expect(selectNewReleases(fetched, []).map((r) => r.tag)).toEqual(['v5', 'v4', 'v3'])
  })

  it('imports only releases newer than the newest stored one', () => {
    const stored = [{ tag: 'v3', published_at: '2026-09-03T00:00:00Z' }]
    expect(selectNewReleases(fetched, stored).map((r) => r.tag)).toEqual(['v5', 'v4'])
  })

  it('never backfills older releases skipped by the first import', () => {
    const stored = fetched.slice(0, 3).map(({ tag, published_at }) => ({ tag, published_at }))
    expect(selectNewReleases(fetched, stored)).toEqual([])
  })
})
