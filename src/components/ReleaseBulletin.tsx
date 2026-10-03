/**
 * One release as a fixed-format bulletin: repo and tag, then the summary as
 * three labelled lines. Pure (no hooks), so the static landing page can
 * render the same component the feed does.
 */
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SUMMARY_LABELS, summaryLines } from '@/lib/summary-lines'
import type { ReleaseStatus } from '@/schemas/releases-schema'

interface Props {
  repo: string
  tag: string
  publishedAt: string
  status: ReleaseStatus
  summary?: string
  /** Extra classes per summary line, e.g. the landing hero's entrance animation. */
  lineClassName?: (index: number) => string
  /** Status chip override, e.g. the landing hero's animated pending-to-ready swap. */
  statusSlot?: ReactNode
  /** Drawn in the same grid cell as the summary, e.g. the hero's fading "Summarizing…". */
  summaryOverlay?: ReactNode
  children?: ReactNode
  className?: string
}

export function ReleaseBulletin({
  repo,
  tag,
  publishedAt,
  status,
  summary,
  lineClassName,
  statusSlot,
  summaryOverlay,
  children,
  className,
}: Props) {
  return (
    <article
      className={cn('rounded-lg border border-border bg-card text-card-foreground', className)}
      data-testid="release-row"
      data-status={status}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3">
        <h3 className="font-mono text-sm">
          <span className="font-medium text-foreground">{repo}</span>{' '}
          <span className="text-muted-foreground">{tag}</span>
        </h3>
        <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
          {/* ISO date: deterministic in prerender and browser, and unambiguous. */}
          <time dateTime={publishedAt}>{publishedAt.slice(0, 10)}</time>
          {statusSlot ?? <StatusChip status={status} />}
        </div>
      </header>
      <div className="grid px-4 py-3" data-testid="release-summary">
        <div className="[grid-area:1/1]">
          <SummaryBody status={status} summary={summary} lineClassName={lineClassName} />
        </div>
        {summaryOverlay && <div className="[grid-area:1/1]">{summaryOverlay}</div>}
      </div>
      {children}
    </article>
  )
}

export function StatusChip({ status, className }: { status: ReleaseStatus; className?: string }) {
  const label = { pending: 'summarizing', ready: 'ready', failed: 'no summary' }[status]
  return (
    <span
      className={cn(
        'rounded-sm border px-1.5 py-px uppercase tracking-wide',
        status === 'ready' ? 'border-primary text-primary' : 'border-border text-muted-foreground',
        className,
      )}
    >
      {label}
    </span>
  )
}

function SummaryBody({
  status,
  summary,
  lineClassName,
}: Pick<Props, 'status' | 'summary' | 'lineClassName'>) {
  if (status === 'pending') return <p className="text-sm text-muted-foreground">Summarizing…</p>
  if (status === 'failed' || !summary) {
    return <p className="text-sm text-muted-foreground">Summary unavailable for this release. The original notes are below.</p>
  }

  const lines = summaryLines(summary)
  if (!lines) return <p className="text-sm leading-relaxed text-foreground">{summary}</p>

  return (
    <dl className="grid gap-x-3 gap-y-1 text-sm leading-relaxed sm:grid-cols-[5.5rem_1fr] sm:gap-y-2">
      {lines.map((line, i) => (
        <div key={SUMMARY_LABELS[i]} className="contents">
          <dt
            className={cn(
              'font-mono text-xs uppercase tracking-wide text-muted-foreground sm:pt-0.5',
              i > 0 && 'pt-2', // space between stacked label groups on narrow screens
              lineClassName?.(i),
            )}
          >
            {SUMMARY_LABELS[i]}
          </dt>
          <dd className={cn('text-foreground', lineClassName?.(i))}>{line}</dd>
        </div>
      ))}
    </dl>
  )
}
