// A numbered procedure, like a docs page, rather than a row of feature cards.
const STEPS = [
  {
    title: 'Follow a repo',
    body: 'Paste owner/name or a GitHub URL. Follow up to 10 public repos.',
    detail: 'vitejs/vite',
  },
  {
    title: 'Releases are checked for you',
    body: 'Every 30 minutes, and right after you follow. Scan now runs a check on demand, once a minute.',
    detail: 'GET /repos/{owner}/{repo}/releases',
  },
  {
    title: 'Read three lines',
    body: 'What changed, whether it breaks anything, and whether to upgrade now. New summaries appear without a reload.',
    detail: 'Changed / Breaking / Upgrade',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border py-16">
      <h2 className="font-mono text-xs uppercase tracking-wide text-muted-foreground">How it works</h2>
      <ol className="mt-8 divide-y divide-border">
        {STEPS.map((step, i) => (
          <li key={step.title} className="grid gap-2 py-6 sm:grid-cols-[3rem_1fr_16rem] sm:gap-6">
            <span className="font-mono text-sm text-primary">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h3 className="font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1 text-muted-foreground">{step.body}</p>
            </div>
            <code className="self-start font-mono text-xs text-muted-foreground sm:text-right">{step.detail}</code>
          </li>
        ))}
      </ol>
    </section>
  )
}
