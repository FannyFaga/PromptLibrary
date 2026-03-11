import { Link } from 'react-router-dom'
import { usePrompts } from '../context/PromptContext'
import { CATEGORIES } from '../data/defaultPrompts'
import { useSearch } from '../hooks/useSearch'
import SearchBar from '../components/SearchBar'
import CategoryFilter from '../components/CategoryFilter'
import SortSelect from '../components/SortSelect'
import PromptCard from '../components/PromptCard'
import EmptyState from '../components/EmptyState'
import StatsBar from '../components/StatsBar'

export default function HomePage() {
  const { prompts, loading, error } = usePrompts()

  // All search + filter state lives in the hook — no useState needed here
  const {
    query,
    setQuery,
    activeCategory,
    setCategory,
    sortKey,
    setSortKey,
    favoritesOnly,
    setFavoritesOnly,
    filtered,
    stats,
    categoryCounts,
    isFiltering,
    clearAll,
  } = useSearch(prompts, 'home')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading prompts…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <p className="text-red-500 font-medium">Failed to load prompts</p>
          <p className="text-sm text-slate-400 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">All Prompts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {prompts.length} prompt{prompts.length !== 1 ? 's' : ''} in the community library
          </p>
        </div>
        <Link
          to="/add"
          className="self-start sm:self-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          + Submit Prompt
        </Link>
      </div>

      {/* ── Stats Bar ── */}
      <StatsBar
        prompts={prompts}
        onClickCategories={() => {
          document.getElementById('category-filter')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }}
        onClickCopies={() => {
          setSortKey('mostUsed')
          document.getElementById('prompt-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
      />

      {/* ── Search ── */}
      <SearchBar value={query} onChange={setQuery} />

      {/* ── Category Filter ── */}
      <div id="category-filter">
        <CategoryFilter
          categories={CATEGORIES}
          active={activeCategory}
          onSelect={setCategory}
          counts={categoryCounts}
        />
      </div>

      {/* ── Toolbar: result count + favorites toggle + sort ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{filtered.length}</span>
          {' '}prompt{filtered.length !== 1 ? 's' : ''}
        </p>

        <div className="flex items-center gap-2">
          {/* ★ Favorites-only toggle — persisted in localStorage */}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            aria-pressed={favoritesOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              favoritesOnly
                ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {favoritesOnly ? '★' : '☆'} Favorites only
          </button>

          <SortSelect value={sortKey} onChange={setSortKey} />
        </div>
      </div>

      {/* ── Results summary bar ── */}
      {isFiltering && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">

          {/* Count */}
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{stats.shown}</span>
            {' '}of{' '}
            <span className="font-semibold text-slate-700">{stats.total}</span>
            {' '}result{stats.shown !== 1 ? 's' : ''}
          </p>

          {/* Per-field breakdown — only shown when there is an active text query */}
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

          {/* Clear all filters */}
          <button
            onClick={clearAll}
            className="ml-auto text-xs text-slate-400 hover:text-red-500 transition-colors underline underline-offset-2"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── Prompt Grid ── */}
      <div id="prompt-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length > 0 ? (
          filtered.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onTagClick={(tag) => { setQuery(tag); setCategory('All') }}
            />
          ))
        ) : prompts.length === 0 ? (
          // ── Case 1: library is completely empty ──────────────────────────
          <EmptyState
            variant="empty"
            message="Your library is empty"
            description="Add your first prompt to start building your personal AI library."
            action={{ label: '+ Add your first prompt', to: '/add' }}
          />
        ) : (
          // ── Case 2: prompts exist but search / filter returned nothing ───
          <EmptyState
            variant="search"
            message="No prompts match your filters"
            description={
              query
                ? `No results for "${query}". Try different keywords or a different category.`
                : 'No prompts in this category. Try a different one or clear all filters.'
            }
            action={{ label: '✕  Clear filters', onClick: clearAll }}
          />
        )}
      </div>

    </div>
  )
}
