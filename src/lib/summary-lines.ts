/** The prompt asks for these three sentences, in this order. */
export const SUMMARY_LABELS = ['Changed', 'Breaking', 'Upgrade'] as const

/**
 * Split a summary into its three sentences so each can carry a label.
 * Returns null when it doesn't split cleanly into exactly three (an
 * abbreviation like "e.g. React" would over-split), and the caller shows
 * the summary as one paragraph instead of mislabelling it.
 */
export function summaryLines(summary: string): string[] | null {
  // Split only on sentence punctuation followed by whitespace and a capital or
  // digit, so version numbers like "8.3.2" stay intact.
  const parts = summary.trim().split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)
  return parts.length === SUMMARY_LABELS.length ? parts : null
}
