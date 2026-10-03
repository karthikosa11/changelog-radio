// Stated plainly, the way good docs list what a tool does not do.
const LIMITS = [
  'Public repos only. Private repos need a GitHub sign-in this app does not ask for.',
  'GitHub Releases only. A tag pushed without a release is not seen.',
  'Summaries come from an AI model and can be wrong. Check the original notes before a risky upgrade.',
  'No email or chat notifications yet. The feed is the only place summaries appear.',
]

export function Limits() {
  return (
    <section className="border-t border-border py-16">
      <h2 className="font-mono text-xs uppercase tracking-wide text-muted-foreground">What it does not do</h2>
      <ul className="mt-6 max-w-2xl space-y-3 text-foreground">
        {LIMITS.map((limit) => (
          <li key={limit} className="flex gap-3">
            <span aria-hidden className="font-mono text-muted-foreground">
              -
            </span>
            <span>{limit}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
