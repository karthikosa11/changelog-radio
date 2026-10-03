import { ReleaseBulletin, StatusChip } from '@/components/ReleaseBulletin'

// A real summary the app produced for vitejs/vite v8.3.1 during development,
// shown verbatim. Not invented copy.
const EXAMPLE = {
  repo: 'vitejs/vite',
  tag: 'v8.3.1',
  publishedAt: '2026-09-24T12:23:55Z',
  summary:
    'This patch release updates dependencies, fixes configuration merging for WebSocket and Rolldown options, corrects optimizer handling of type imports, and resolves server watcher and sourcemap issues. There are no breaking changes in this release. Upgrade now as this is a stable patch that fixes several bugs affecting configuration, dependency optimization, and server behavior.',
}

/** The hero: one release settles from "summarizing" into its three lines, once (CSS in styles.css). */
export function HeroDemo() {
  return (
    <figure className="space-y-3">
      <ReleaseBulletin
        {...EXAMPLE}
        status="ready"
        className="shadow-[0_1px_3px_0_var(--color-border)]"
        lineClassName={(i) => `hero-line-${i}`}
        summaryOverlay={
          <p aria-hidden className="hero-pending text-sm text-muted-foreground">
            Summarizing…
          </p>
        }
        statusSlot={
          // Both chips share one grid cell; CSS swaps them at 1.2s.
          <span className="grid justify-items-end">
            <StatusChip status="pending" className="hero-pending [grid-area:1/1]" />
            <StatusChip status="ready" className="hero-ready [grid-area:1/1]" />
          </span>
        }
      />
      <figcaption className="font-mono text-xs text-muted-foreground">
        A real summary from the feed. The original notes stay one click away.
      </figcaption>
    </figure>
  )
}
