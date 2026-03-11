/**
 * SortSelect — a compact styled dropdown for choosing a sort order.
 *
 * Props:
 *   value     {string}    current sort key (one of SORT_OPTIONS[*].value)
 *   onChange  {function}  called with the new sort key string
 */
const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest first'    },
  { value: 'oldest',   label: 'Oldest first'    },
  { value: 'az',       label: 'A → Z'           },
  { value: 'za',       label: 'Z → A'           },
  { value: 'favorites', label: 'Favorites first' },
  { value: 'mostUsed', label: 'Most used'       },
]

export default function SortSelect({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-xs text-slate-400 whitespace-nowrap select-none">
        Sort by
      </label>
      <div className="relative">
        <select
          id="sort-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {/* Chevron — pointer-events-none so it doesn't block the select */}
        <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
