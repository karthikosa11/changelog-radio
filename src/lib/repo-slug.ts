/**
 * Parse user input into a GitHub owner/name pair. Accepts "owner/name" or a
 * github.com URL. Lowercased because GitHub names are case-insensitive and the
 * lowercase slug is the dedupe key across followers.
 */
export interface RepoSlug {
  owner: string
  name: string
}

// GitHub's own limits: owners are alphanumeric + single hyphens (max 39),
// repo names allow letters, digits, '.', '_' and '-' (max 100).
const OWNER_RE = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/
const NAME_RE = /^[a-z0-9._-]{1,100}$/

export function parseRepoSlug(input: string): RepoSlug | null {
  let text = input.trim().toLowerCase()
  text = text.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '')
  text = text.replace(/\.git$/, '').replace(/\/+$/, '')

  const parts = text.split('/')
  // A URL may continue past the repo (e.g. /releases); keep the first two segments.
  if (parts.length < 2) return null
  const [owner, name] = parts
  if (!OWNER_RE.test(owner) || !NAME_RE.test(name) || name === '.' || name === '..') return null
  return { owner, name }
}

export function formatRepoSlug({ owner, name }: RepoSlug): string {
  return `${owner}/${name}`
}
