import { describe, expect, it } from 'vitest'
import { summaryLines } from './summary-lines'

describe('summaryLines', () => {
  it('splits a three-sentence summary and keeps version numbers whole', () => {
    expect(
      summaryLines('Vite 8.3.2 fixes CSS preloading. There are no breaking changes. Upgrade now if you hit the bug.'),
    ).toEqual(['Vite 8.3.2 fixes CSS preloading.', 'There are no breaking changes.', 'Upgrade now if you hit the bug.'])
  })

  it('returns null when the summary is not exactly three sentences', () => {
    expect(summaryLines('One sentence only.')).toBeNull()
    expect(summaryLines('A. B. C. D.')).toBeNull()
  })
})
