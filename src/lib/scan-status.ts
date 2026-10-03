import type { ScanResult } from './jobs'

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/**
 * One line describing a finished scan. Not-found repos come right after the
 * count, because a typo'd or deleted repo is the thing the user can act on.
 */
export function scanResultText(result: ScanResult): string {
  if (result.rateLimited) return `Scanned recently. Try again in ${result.retryInSec}s.`

  const parts = [`Checked ${plural(result.repos, 'repo')}`]
  if (result.failedRepos) parts.push(`${result.failedRepos} not found`)
  // "0 new releases" says nothing when no repo could be checked at all.
  if (result.failedRepos < result.repos) parts.push(`${plural(result.newReleases, 'new release')}`)
  return `${parts.join(', ')}.`
}
