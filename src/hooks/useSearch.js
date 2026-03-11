import { useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { filterPrompts, sortPrompts, getMatchFields } from '../utils/helpers'

// All preference keys live under this root so they never clash with
// the prompts data key ('prompt-library:prompts') or with each other.
const STORAGE_ROOT = 'prompt-library:ui'

/**
 * useSearch — encapsulates all search, filter, and sort state for a prompt list.
 * Every UI preference is persisted in localStorage so it survives page refreshes.
 *
 * ── How safe initialisation works ───────────────────────────────────────────
 * Each useLocalStorage call uses a lazy initialiser inside useState: it reads
 * from localStorage exactly ONCE when the component first mounts. After that,
 * React owns the state; localStorage is only updated when a value changes.
 * If a stored value is missing, corrupt, or the wrong type, the fallback (second
 * argument) is returned instead — the app never crashes on stale data.
 *
 * ── Namespace isolation ──────────────────────────────────────────────────────
 * The `namespace` parameter scopes every key to one page, so HomePage and
 * FavoritesPage each get their own independent persisted state.
 * Example keys for namespace 'home':
 *   prompt-library:ui:home:query
 *   prompt-library:ui:home:category
 *   prompt-library:ui:home:sort
 *   prompt-library:ui:home:favoritesOnly
 *
 * @param {Array}  prompts   - full prompt array from context
 * @param {string} namespace - key prefix, e.g. 'home' or 'favorites'
 */
export function useSearch(prompts, namespace = 'home') {
  // Build a fully-qualified localStorage key for a single preference field.
  const k = (field) => `${STORAGE_ROOT}:${namespace}:${field}`

  // ── Persisted UI preferences ─────────────────────────────────────────────
  // useLocalStorage is a drop-in for useState; each call reads from
  // localStorage on mount and writes back on every change.
  const [query,          setQuery]         = useLocalStorage(k('query'),         '')
  const [activeCategory, setCategory]      = useLocalStorage(k('category'),      'All')
  const [sortKey,        setSortKey]       = useLocalStorage(k('sort'),          'newest')
  const [favoritesOnly,  setFavoritesOnly] = useLocalStorage(k('favoritesOnly'), false)

  // ── Step 0: favorites-only pre-filter ────────────────────────────────────
  // Narrowing to favorites happens before search/category so every downstream
  // memo works on the already-correct base set.
  // On FavoritesPage this has no extra effect — every prompt passed in is
  // already a favorite — but it doesn't break anything either.
  const basePrompts = useMemo(
    () => (favoritesOnly ? prompts.filter((p) => p.favorite) : prompts),
    [prompts, favoritesOnly],
  )

  // ── Step 1: filter (search + category) ──────────────────────────────────
  // Kept separate from sorting so stats always reflect true match counts.
  const filtered = useMemo(
    () => filterPrompts(basePrompts, { search: query, category: activeCategory }),
    [basePrompts, query, activeCategory],
  )

  // ── Step 2: sort (applied after filter) ─────────────────────────────────
  // A second memo that only re-runs when the filtered list or sort key change.
  const sorted = useMemo(
    () => sortPrompts(filtered, sortKey),
    [filtered, sortKey],
  )

  // ── Per-category counts (respects search query + favoritesOnly) ──────────
  // Used by CategoryFilter for live badge counts. activeCategory is
  // deliberately ignored so badges always show totals for the current query.
  const categoryCounts = useMemo(() => {
    const base = filterPrompts(basePrompts, { search: query, category: 'All' })
    const counts = { All: base.length }
    base.forEach((p) => {
      counts[p.category] = (counts[p.category] ?? 0) + 1
    })
    return counts
  }, [basePrompts, query])

  // ── Stats: how many results matched, and via which fields ───────────────
  // Uses `filtered` (pre-sort) so the count is always accurate.
  const stats = useMemo(() => {
    if (!query.trim()) {
      return { total: basePrompts.length, shown: filtered.length, byField: null }
    }

    const byField = filtered.reduce(
      (acc, p) => {
        const m = getMatchFields(p, query)
        return {
          title: acc.title + (m.title ? 1 : 0),
          tags:  acc.tags  + (m.tags  ? 1 : 0),
          text:  acc.text  + (m.text  ? 1 : 0),
        }
      },
      { title: 0, tags: 0, text: 0 },
    )

    return { total: basePrompts.length, shown: filtered.length, byField }
  }, [basePrompts, filtered, query])

  // ── Convenience helpers ─────────────────────────────────────────────────

  /** Returns { title, tags, text } booleans for a single prompt */
  const matchFieldsFor = (prompt) => getMatchFields(prompt, query)

  // favoritesOnly counts as an active filter so the results bar and
  // "Clear filters" button appear whenever it is on.
  const isFiltering = query.trim() !== '' || activeCategory !== 'All' || favoritesOnly

  // Resets every persisted preference back to its default value.
  // useLocalStorage writes the fallback to localStorage automatically.
  function clearAll() {
    setQuery('')
    setCategory('All')
    setFavoritesOnly(false)
    setSortKey('newest')
  }

  return {
    query,
    setQuery,
    activeCategory,
    setCategory,
    sortKey,
    setSortKey,
    favoritesOnly,
    setFavoritesOnly,
    filtered: sorted,   // sorted filtered list — what pages render
    matchFieldsFor,
    stats,
    categoryCounts,
    isFiltering,
    clearAll,
  }
}
