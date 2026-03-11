/** Generate a collision-free unique ID.
 *  Uses crypto.randomUUID() when available (all modern browsers on HTTPS),
 *  falls back to timestamp + random for HTTP / legacy environments.
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

/** Copy text to the clipboard. Returns true on success, false on failure. */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Search helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Returns an object describing which fields of a prompt match the query.
 * Used to show "matched in: title, tags" breakdown in the UI.
 *
 * @param   {object} prompt  - a single prompt object
 * @param   {string} query   - the raw search string
 * @returns {{ title: boolean, tags: boolean, text: boolean }}
 */
export function getMatchFields(prompt, query) {
  if (!query) return { title: false, tags: false, text: false }
  const q = query.trim().toLowerCase()
  return {
    // Does the title contain the query string?
    title: prompt.title.toLowerCase().includes(q),

    // Does ANY tag contain the query string?
    // Array.isArray guard keeps it safe if tags is undefined.
    tags:
      Array.isArray(prompt.tags) &&
      prompt.tags.some((tag) => tag.toLowerCase().includes(q)),

    // Does the full prompt body contain the query string?
    text: prompt.text.toLowerCase().includes(q),
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Sort helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * All five sort comparators live here so the logic is in one place
 * and can be unit-tested independently of any React component.
 *
 * localeCompare uses the browser's locale for correct Unicode ordering.
 * [...prompts].sort() — the spread ensures we never mutate the original array.
 */
const SORT_FNS = {
  newest:    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  oldest:    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  az:        (a, b) => a.title.localeCompare(b.title),
  za:        (a, b) => b.title.localeCompare(a.title),
  // Favorites first; break ties by newest so the order within each group is stable
  favorites: (a, b) => {
    if (b.favorite !== a.favorite) return b.favorite ? 1 : -1
    return new Date(b.createdAt) - new Date(a.createdAt)
  },
  // Highest copy count first; ties broken by newest
  mostUsed: (a, b) => {
    const diff = (b.copyCount ?? 0) - (a.copyCount ?? 0)
    if (diff !== 0) return diff
    return new Date(b.createdAt) - new Date(a.createdAt)
  },
}

/**
 * Sort a prompt array by one of the five named sort keys.
 *
 * @param   {Array}  prompts  - the array to sort (not mutated)
 * @param   {string} key      - one of: 'newest' | 'oldest' | 'az' | 'za' | 'favorites'
 * @returns {Array}  new sorted array
 */
export function sortPrompts(prompts, key) {
  const fn = SORT_FNS[key] ?? SORT_FNS.newest
  return [...prompts].sort(fn)
}

/**
 * Count prompts created within the last `days` calendar days.
 * Used by the dashboard stats bar to show "added this week" etc.
 *
 * @param   {Array}  prompts  - full prompt array
 * @param   {number} days     - look-back window (default 7)
 * @returns {number}
 */
export function getRecentCount(prompts, days = 7) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return prompts.filter((p) => new Date(p.createdAt).getTime() >= cutoff).length
}

/**
 * Return the N most recently created prompts, sorted newest-first.
 * A pure helper — no React, no side-effects, easy to unit-test.
 *
 * @param   {Array}  prompts  - full prompt array
 * @param   {number} n        - how many to return (default 5)
 * @returns {Array}  new array (original is never mutated)
 */
export function getRecentPrompts(prompts, n = 5) {
  return [...prompts]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, n)
}

/**
 * Filter a list of prompts by search query and/or category.
 *
 * Search checks THREE fields: title, tags (any tag), and prompt text.
 * A prompt is included if the query matches ANY of those three fields.
 *
 * @param   {Array}  prompts  - full prompt array
 * @param   {object} filters  - { search: string, category: string }
 * @returns {Array}  filtered prompt array
 */
export function filterPrompts(prompts, { search = '', category } = {}) {
  const query = search.trim()

  return prompts.filter((p) => {
    // ── Category gate ────────────────────────────────────────────────────
    // 'All' means no category filter is active, so everything passes.
    const matchesCategory = category === 'All' || p.category === category
    if (!matchesCategory) return false

    // ── Search gate ──────────────────────────────────────────────────────
    // Empty query → no text filter; show everything in the category.
    if (!query) return true

    // Re-use getMatchFields so the logic lives in exactly one place.
    const fields = getMatchFields(p, query)
    return fields.title || fields.tags || fields.text
  })
}

/**
 * Extract unique placeholder tokens from a prompt text.
 * A token is any text wrapped in square brackets, e.g. [topic] → 'topic'.
 * Duplicate tokens (same word used more than once) are deduplicated so the
 * fill-in form shows each input exactly once.
 *
 * @param   {string} text  - raw prompt text
 * @returns {string[]}     - ordered array of unique token names
 */
export function extractTokens(text) {
  if (!text) return []
  const matches = [...text.matchAll(/\[([^\]]+)\]/g)]
  return [...new Set(matches.map((m) => m[1]))]
}
