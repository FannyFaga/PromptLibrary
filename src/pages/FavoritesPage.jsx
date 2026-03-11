import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { usePrompts } from '../context/PromptContext'
import { CATEGORIES } from '../data/defaultPrompts'
import { useSearch } from '../hooks/useSearch'
import SearchBar from '../components/SearchBar'
import CategoryFilter from '../components/CategoryFilter'
import SortSelect from '../components/SortSelect'
import PromptCard from '../components/PromptCard'
import EmptyState from '../components/EmptyState'

export default function FavoritesPage() {
  const { prompts, loading } = usePrompts()

  // Memoised so useSearch gets a stable reference and only re-runs when
  // the underlying prompts array actually changes.
  const favorites = useMemo(() => prompts.filter((p) => p.favorite), [prompts])

  const {
    query,
    setQuery,
    activeCategory,
    setCategory,
    sortKey,
    setSortKey,
    filtered,
    categoryCounts,
    stats,
    isFiltering,
    clearAll,
  } = useSearch(favorites, 'favorites')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">★ Favorites</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {favorites.length} saved prompt{favorites.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/"
          className="self-start sm:self-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
        >
          ← Back to All
        </Link>
      </div>

      {/* Only show search + filter when there are favorites */}
      {favorites.length > 0 && (
        <>
          <SearchBar value={query} onChange={setQuery} />

          <CategoryFilter
            categories={CATEGORIES}
            active={activeCategory}
            onSelect={setCategory}
            counts={categoryCounts}
          />

          {/* ── Toolbar: result count + sort ── */}
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{filtered.length}</span>
              {' '}favorite{filtered.length !== 1 ? 's' : ''}
            </p>
            <SortSelect value={sortKey} onChange={setSortKey} />
          </div>

          {/* ── Results summary bar ── */}
          {isFiltering && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">

              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{stats.shown}</span>
                {' '}of{' '}
                <span className="font-semibold text-slate-700">{stats.total}</span>
                {' '}favorite{stats.shown !== 1 ? 's' : ''}
              </p>

              {stats.byField && stats.shown > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">matched in:</span>
                  {stats.byField.title > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium">
                      title ({stats.byField.title})
                    </span>
                  )}
                  {stats.byField.tags > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 text-xs font-medium">
                      tags ({stats.byField.tags})
                    </span>
                  )}
                  {stats.byField.text > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                      content ({stats.byField.text})
                    </span>
                  )}
                </div>
              )}

              <button
                onClick={clearAll}
                className="ml-auto text-xs text-slate-400 hover:text-red-500 transition-colors underline underline-offset-2"
              >
                Clear filters
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length > 0 ? (
          filtered.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onTagClick={(tag) => { setQuery(tag); setCategory('All') }}
            />
          ))
        ) : favorites.length === 0 ? (
          // ── Case 1: nothing is starred yet ──────────────────────────────
          <EmptyState
            variant="favorites"
            message="No favorites yet"
            description="Star any prompt from your library to save it here for quick access."
            action={{ label: 'Browse all prompts', to: '/' }}
          />
        ) : (
          // ── Case 2: favorites exist but search / filter returned nothing ─
          <EmptyState
            variant="search"
            message="No favorites match your filters"
            description={
              query
                ? `No results for "${query}". Try different keywords or clear your filters.`
                : 'No favorites in this category. Try a different one or clear all filters.'
            }
            action={{ label: '✕  Clear filters', onClick: clearAll }}
          />
        )}
      </div>

    </div>
  )
}

