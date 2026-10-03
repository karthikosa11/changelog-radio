import { ExternalLink } from 'lucide-react'
import { ReleaseBulletin } from '@/components/ReleaseBulletin'
import type { Release } from '@/schemas/releases-schema'

export function ReleaseCard({ release }: { release: Release }) {
  const githubUrl = `https://github.com/${release.repo}/releases/tag/${encodeURIComponent(release.tag)}`

  return (
    <ReleaseBulletin
      repo={release.repo}
      tag={release.tag}
      publishedAt={release.published_at}
      status={release.status}
      summary={release.summary}
    >
      <footer className="flex flex-wrap items-start justify-between gap-3 border-t border-border px-4 py-2 text-sm">
        {release.raw_notes ? (
          <details className="group min-w-0 flex-1">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Original release notes
            </summary>
            {/* Plain text on purpose: notes are untrusted markdown from GitHub. */}
            <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
              {release.raw_notes}
            </pre>
          </details>
        ) : (
          <span className="text-muted-foreground">No release notes were published.</span>
        )}
        <a
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          GitHub <ExternalLink className="size-3.5" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </footer>
    </ReleaseBulletin>
  )
}
