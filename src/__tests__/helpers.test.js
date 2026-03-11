import { describe, it, expect } from 'vitest'
import {
  filterPrompts,
  sortPrompts,
  getMatchFields,
  generateId,
  extractTokens,
  getRecentCount,
} from '../utils/helpers'

// ─── Shared fixture ───────────────────────────────────────────────────────────

const NOW    = Date.now()
const DAY_MS = 24 * 60 * 60 * 1000

const PROMPTS = [
  {
    id: '1',
    title: 'Blog Writer',
    category: 'Writing',
    tags: ['blog', 'seo'],
    text: 'Write a blog post about [topic] in [tone] tone.',
    favorite: true,
    copyCount: 5,
    createdAt: new Date(NOW - 1 * DAY_MS).toISOString(),   // 1 day ago
  },
  {
    id: '2',
    title: 'Code Review',
    category: 'Coding',
    tags: ['code', 'review'],
    text: 'Review this code for quality issues.',
    favorite: false,
    copyCount: 12,
    createdAt: new Date(NOW - 10 * DAY_MS).toISOString(),  // 10 days ago
  },
  {
    id: '3',
    title: 'Email Draft',
    category: 'Writing',
    tags: ['email'],
    text: 'Draft a professional email about [subject].',
    favorite: false,
    copyCount: 0,
    createdAt: new Date(NOW - 20 * DAY_MS).toISOString(),  // 20 days ago
  },
]

// ─── filterPrompts ────────────────────────────────────────────────────────────

describe('filterPrompts', () => {
  it('returns all prompts when no filters are active', () => {
    expect(filterPrompts(PROMPTS, { search: '', category: 'All' })).toHaveLength(3)
  })

  it('uses an empty search default so omitting the key does not throw', () => {
    expect(filterPrompts(PROMPTS, { category: 'All' })).toHaveLength(3)
  })

  it('filters by category', () => {
    const result = filterPrompts(PROMPTS, { search: '', category: 'Writing' })
    expect(result).toHaveLength(2)
    expect(result.every((p) => p.category === 'Writing')).toBe(true)
  })

  it('searches by title (case-insensitive)', () => {
    expect(filterPrompts(PROMPTS, { search: 'BLOG', category: 'All' })).toHaveLength(1)
  })

  it('searches by tag', () => {
    expect(filterPrompts(PROMPTS, { search: 'seo', category: 'All' })).toHaveLength(1)
  })

  it('searches by prompt text content', () => {
    expect(filterPrompts(PROMPTS, { search: 'quality', category: 'All' })).toHaveLength(1)
  })

  it('combines category filter with text search', () => {
    const result = filterPrompts(PROMPTS, { search: 'email', category: 'Writing' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3')
  })

  it('returns an empty array when nothing matches', () => {
    expect(filterPrompts(PROMPTS, { search: 'zzzzz', category: 'All' })).toHaveLength(0)
  })
})

// ─── sortPrompts ──────────────────────────────────────────────────────────────

describe('sortPrompts', () => {
  it('sorts newest first', () => {
    const result = sortPrompts(PROMPTS, 'newest')
    expect(result[0].id).toBe('1')
    expect(result[result.length - 1].id).toBe('3')
  })

  it('sorts oldest first', () => {
    const result = sortPrompts(PROMPTS, 'oldest')
    expect(result[0].id).toBe('3')
  })

  it('sorts A \u2192 Z by title', () => {
    const result = sortPrompts(PROMPTS, 'az')
    expect(result[0].title).toBe('Blog Writer')
  })

  it('sorts Z \u2192 A by title', () => {
    const result = sortPrompts(PROMPTS, 'za')
    expect(result[0].title).toBe('Email Draft')
  })

  it('puts favorites first, then newest within each group', () => {
    const result = sortPrompts(PROMPTS, 'favorites')
    expect(result[0].favorite).toBe(true)
  })

  it('sorts by most used (highest copyCount first)', () => {
    const result = sortPrompts(PROMPTS, 'mostUsed')
    expect(result[0].copyCount).toBe(12)
    expect(result[result.length - 1].copyCount).toBe(0)
  })

  it('does NOT mutate the original array', () => {
    const ids = PROMPTS.map((p) => p.id)
    sortPrompts(PROMPTS, 'za')
    expect(PROMPTS.map((p) => p.id)).toEqual(ids)
  })

  it('falls back to newest sort for an unknown key', () => {
    const result = sortPrompts(PROMPTS, 'nonexistent')
    expect(result[0].id).toBe('1')
  })
})

// ─── getMatchFields ───────────────────────────────────────────────────────────

describe('getMatchFields', () => {
  const p = PROMPTS[0] // Blog Writer — tags: ['blog','seo'] — text has [topic]

  it('detects a title match', () => {
    expect(getMatchFields(p, 'blog').title).toBe(true)
  })

  it('detects a tag match', () => {
    expect(getMatchFields(p, 'seo').tags).toBe(true)
  })

  it('detects a text content match', () => {
    expect(getMatchFields(p, 'topic').text).toBe(true)
  })

  it('returns all false when nothing matches', () => {
    const m = getMatchFields(p, 'zzz')
    expect(Object.values(m).every((v) => v === false)).toBe(true)
  })

  it('returns all false for an empty query', () => {
    const m = getMatchFields(p, '')
    expect(Object.values(m).every((v) => v === false)).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(getMatchFields(p, 'BLOG').title).toBe(true)
  })
})

// ─── generateId ───────────────────────────────────────────────────────────────

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string')
    expect(generateId().length).toBeGreaterThan(0)
  })

  it('produces unique IDs across 200 rapid calls', () => {
    const ids = new Set(Array.from({ length: 200 }, generateId))
    expect(ids.size).toBe(200)
  })
})

// ─── extractTokens ────────────────────────────────────────────────────────────

describe('extractTokens', () => {
  it('extracts a single token', () => {
    expect(extractTokens('Write about [topic]')).toEqual(['topic'])
  })

  it('extracts multiple unique tokens in order', () => {
    expect(extractTokens('Write [count] posts about [topic]')).toEqual(['count', 'topic'])
  })

  it('deduplicates repeated tokens', () => {
    expect(extractTokens('[topic] and more [topic]')).toEqual(['topic'])
  })

  it('returns an empty array when there are no tokens', () => {
    expect(extractTokens('No placeholders here')).toEqual([])
  })

  it('returns an empty array for an empty string', () => {
    expect(extractTokens('')).toEqual([])
  })

  it('handles multi-word tokens', () => {
    expect(extractTokens('Write about [your topic here]')).toEqual(['your topic here'])
  })
})

// ─── getRecentCount ───────────────────────────────────────────────────────────

describe('getRecentCount', () => {
  it('counts only prompts within the look-back window', () => {
    // PROMPTS[0] is 1 day old  → inside 7-day window
    // PROMPTS[1] is 10 days old → outside 7-day window
    // PROMPTS[2] is 20 days old → outside 7-day window
    expect(getRecentCount(PROMPTS, 7)).toBe(1)
  })

  it('counts all prompts when the window is large enough', () => {
    expect(getRecentCount(PROMPTS, 30)).toBe(3)
  })

  it('returns 0 when no prompts fall within the window', () => {
    expect(getRecentCount(PROMPTS, 0)).toBe(0)
  })
})
