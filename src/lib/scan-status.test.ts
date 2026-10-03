import { describe, expect, it } from 'vitest'
import { scanResultText } from './scan-status'

describe('scanResultText', () => {
  it('reports a repo that was not found, without a meaningless release count', () => {
    expect(scanResultText({ rateLimited: false, repos: 1, newReleases: 0, failedRepos: 1 })).toBe(
      'Checked 1 repo, 1 not found.',
    )
  })

  it('puts not-found before new releases when some repos worked', () => {
    expect(scanResultText({ rateLimited: false, repos: 3, newReleases: 2, failedRepos: 1 })).toBe(
      'Checked 3 repos, 1 not found, 2 new releases.',
    )
  })

  it('reports plain results when every repo was found', () => {
    expect(scanResultText({ rateLimited: false, repos: 2, newReleases: 1, failedRepos: 0 })).toBe(
      'Checked 2 repos, 1 new release.',
    )
  })

  it('explains the cooldown', () => {
    expect(scanResultText({ rateLimited: true, retryInSec: 42 })).toBe('Scanned recently. Try again in 42s.')
  })
})
