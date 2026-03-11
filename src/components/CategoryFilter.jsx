// All Tailwind classes are written out fully so the JIT scanner picks them up.
const CATEGORY_STYLES = {
  All: {
    active:   'bg-slate-800 text-white border-slate-800',
    inactive: 'text-slate-600 border-slate-200 hover:bg-slate-800 hover:text-white hover:border-slate-800',
  },
  Writing: {
    active:   'bg-violet-100 text-violet-700 border-violet-200',
    inactive: 'text-slate-600 border-slate-200 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200',
  },
  Coding: {
    active:   'bg-blue-100 text-blue-700 border-blue-200',
    inactive: 'text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200',
  },
  Marketing: {
    active:   'bg-orange-100 text-orange-700 border-orange-200',
    inactive: 'text-slate-600 border-slate-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200',
  },
  Productivity: {
    active:   'bg-emerald-100 text-emerald-700 border-emerald-200',
    inactive: 'text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200',
  },
  Other: {
    active:   'bg-slate-100 text-slate-700 border-slate-300',
    inactive: 'text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700 hover:border-slate-300',
  },
}

/**
 * A row of pill buttons used to filter prompts by category.
 *
 * Props:
 *   categories – string[]             list of category names (from CATEGORIES constant)
 *   active     – string               currently selected category
 *   onSelect   – (cat) => void
 *   counts     – Record<string,number> optional; when provided shows a live
 *                                      count badge on each button
 */
export default function CategoryFilter({ categories, active, onSelect, counts }) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const styles  = CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.Other
        const isActive = active === cat
        const count   = counts?.[cat]
        // Dim a button when counts are available and this category has nothing
        const isEmpty = counts != null && count === 0 && !isActive

        return (
          <button
            key={cat}
            onClick={isEmpty ? undefined : () => onSelect(cat)}
            disabled={isEmpty}
            aria-pressed={isActive}
            className={`
              px-4 py-1.5 rounded-full text-sm font-medium border transition-all
              inline-flex items-center gap-1.5
              ${isActive
                ? styles.active
                : isEmpty
                  ? 'text-slate-300 border-slate-100 cursor-default'
                  : styles.inactive}
            `}
          >
            {cat}

            {/* Count badge — only rendered when the parent provides counts */}
            {count != null && (
              <span
                className={`
                  inline-flex items-center justify-center
                  min-w-[1.25rem] h-5 px-1 rounded-full text-xs font-semibold
                  ${isActive
                    ? 'bg-white/25 text-current'
                    : isEmpty
                      ? 'text-slate-300'
                      : 'bg-black/[0.06] text-slate-500'}
                `}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
