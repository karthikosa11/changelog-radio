import { describe, expect, it } from 'vitest'
import { formatRepoSlug, parseRepoSlug } from './repo-slug'

describe('parseRepoSlug', () => {
  it.each([
    ['vitejs/vite', 'vitejs/vite'],
    ['  Vitejs/Vite  ', 'vitejs/vite'],
    ['https://github.com/vitejs/vite', 'vitejs/vite'],
    ['github.com/vitejs/vite/', 'vitejs/vite'],
    ['https://www.github.com/vitejs/vite.git', 'vitejs/vite'],
    ['https://github.com/vitejs/vite/releases/tag/v8.3.2', 'vitejs/vite'],
    ['facebook/react.dev', 'facebook/react.dev'],
  ])('accepts %s', (input, expected) => {
    const slug = parseRepoSlug(input)
    expect(slug && formatRepoSlug(slug)).toBe(expected)
  })

  it.each(['', 'vite', '/vite', 'vitejs/', '-bad/repo', 'bad--owner/repo', 'owner/..', 'owner/has space', 'https://gitlab.com/a/b'])(
    'rejects %j',
    (input) => {
      expect(parseRepoSlug(input)).toBeNull()
    },
  )
})
