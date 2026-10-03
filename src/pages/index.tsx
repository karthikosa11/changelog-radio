/**
 * Design Direction
 *
 * Product: For a developer who depends on a handful of open-source libraries:
 *   follow their GitHub repos and get each new release as three plain
 *   sentences (what changed, whether it breaks, whether to upgrade now).
 * Emotion: Reading the one line in a dependency-bump PR that says it is safe
 *   to merge, and closing the tab.
 * Metaphor: The departures board at a quiet regional station: a short list
 *   of lines, one status per row, updated in place.
 * References: SBB station departure boards; the BBC Shipping Forecast (fixed
 *   format, read on schedule, no adjectives); a pharmacy package leaflet.
 * Signature: Every release is the same three labelled lines,
 *   CHANGED / BREAKING / UPGRADE, in mono labels beside plain sentences.
 * Hero: A real release card shows "summarizing"; at 1.2s the chip flips to
 *   "ready" and the three labelled lines settle in, 300ms apart. Once. Nothing loops.
 *
 * Style Tile
 * - Color: warm paper neutral (dominant) + near-black ink + one burnt-orange
 *   signal accent, low saturation.
 * - Type: IBM Plex Mono for labels, tags and dates + IBM Plex Sans for prose;
 *   a technical family that reads like good documentation.
 * - Theme: light; it is skimmed in daylight between other work, like a
 *   printed bulletin.
 * - Art direction: modern minimalism.
 * - Motion: stillness; one settle-in on the hero, no scroll effects.
 * - Voice: second person; sentences under 15 words; state limits and numbers
 *   plainly (10 repos, every 30 minutes).
 *
 * This page is STATIC: it lives at the top level of src/pages/, so it mounts
 * no auth session and no records WebSocket, and it is prerendered at build.
 * The hero animation is CSS-only for that reason.
 */

import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { HeroDemo } from '../components/landing/HeroDemo'
import { HowItWorks } from '../components/landing/HowItWorks'
import { Limits } from '../components/landing/Limits'
import { seo } from '../seo'

const primaryLink =
  'inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

export default function Landing() {
  return (
    <>
      <Seo {...seo} path="/" />
      <div data-testid="static-landing" className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-10 border-b border-border bg-background">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
            <span className="font-mono text-sm font-medium">changelog radio</span>
            <nav className="flex items-center gap-6 text-sm">
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground">
                How it works
              </a>
              <Link to="/feed" className="font-medium text-primary hover:underline">
                Open your feed
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6">
          <section className="grid items-center gap-12 py-16 md:grid-cols-[1fr_1.1fr] md:py-24">
            <div>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Your dependencies’ releases, in three sentences.
              </h1>
              <p className="mt-5 max-w-md text-lg text-muted-foreground">
                Follow up to 10 public GitHub repos. Each new release is summarized: what changed,
                whether it breaks anything, and whether to upgrade now.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/feed" className={primaryLink}>
                  Open your feed
                </Link>
                <span className="text-sm text-muted-foreground">Sign-in required. Only you see what you follow.</span>
              </div>
            </div>
            <HeroDemo />
          </section>

          <HowItWorks />
          <Limits />

          <section className="my-16 flex flex-col items-start justify-between gap-6 rounded-lg bg-foreground px-8 py-10 text-background sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold">Start with one repo.</h2>
              <p className="mt-1">Pick the dependency you upgrade least carefully.</p>
            </div>
            <Link to="/feed" className={primaryLink}>
              Open your feed
            </Link>
          </section>
        </main>

        <footer className="border-t border-border">
          <p className="mx-auto max-w-5xl px-6 py-6 font-mono text-xs text-muted-foreground">
            changelog radio · release data from the GitHub API · summaries by Claude Haiku · built on DeepSpace
          </p>
        </footer>
      </div>
    </>
  )
}
