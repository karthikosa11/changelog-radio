/**
 * The AI call: release notes in, three sentences out. Owner-billed, because
 * there is no authToken; createDeepSpaceAI falls back to APP_OWNER_JWT.
 */
import { generateText } from 'ai'
import { createDeepSpaceAI } from 'deepspace/worker'
import type { Env } from '../../worker'

// Haiku: a short, structured summary doesn't need a bigger model. In the
// step-1 spike it took ~4s and ~$0.0025 for a 4.6k-char changelog.
const MODEL = 'claude-haiku-4-5'

// Long changelogs are mostly lists of PR links; the first ~12k chars carry the gist.
const MAX_PROMPT_NOTES_CHARS = 12_000

const SYSTEM = [
  'You summarize software release notes for a busy developer.',
  'Reply with exactly three plain sentences and nothing else:',
  '(1) what changed, (2) whether it is breaking and what breaks,',
  '(3) whether to upgrade now, later, or skip, and why.',
  'No markdown, no lists, no preamble.',
].join(' ')

export const NO_NOTES_SUMMARY = 'This release was published without release notes, so there is nothing to summarize.'

export async function writeSummary(
  env: Env,
  release: { repo: string; tag: string; notes: string },
  signal: AbortSignal,
): Promise<string> {
  // Not worth a model call, and the model would only guess.
  if (!release.notes.trim()) return NO_NOTES_SUMMARY

  const ai = createDeepSpaceAI(env, 'anthropic')
  const { text } = await generateText({
    model: ai(MODEL),
    system: SYSTEM,
    prompt: `Repository: ${release.repo}\nRelease: ${release.tag}\n\nRelease notes:\n${release.notes.slice(0, MAX_PROMPT_NOTES_CHARS)}`,
    maxOutputTokens: 300,
    temperature: 0.2,
    abortSignal: signal,
  })

  const summary = text.trim()
  if (!summary) throw new Error('Model returned an empty summary')
  return summary
}
