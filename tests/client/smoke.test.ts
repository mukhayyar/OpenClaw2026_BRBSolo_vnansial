import { describe, it, expect } from 'vitest'

describe('frontend smoke', () => {
  it('basic math sanity', () => {
    expect(1 + 1).toBe(2)
  })

  it('vite env shape', () => {
    expect(typeof import.meta.env).toBe('object')
  })
})
