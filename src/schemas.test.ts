import { describe, expect, it } from 'vitest'
import { lintSchemas } from 'deepspace/worker'
import { schemas } from './schemas'

describe('schemas', () => {
  // The SDK linter catches permission mistakes such as a spoofable ownerField.
  it('pass the DeepSpace schema linter', () => {
    expect(lintSchemas(schemas)).toEqual([])
  })
})
