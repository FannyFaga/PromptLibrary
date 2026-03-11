import { Link } from 'react-router-dom'

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconInbox() {
  return (
    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" strokeWidth={1.5} strokeLinecap="round" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.5 11h5M11 8.5v5" />
    </svg>
  )
}

function IconStar() {
  return (
    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
}

// ── Variant config ────────────────────────────────────────────────────────────
//
// Each variant controls the icon, its background colour, and its icon colour.
// 'empty'     – shown when the library has no prompts at all
// 'search'    – shown when a search/filter returns zero results
// 'favorites' – shown on the Favorites page when nothing is starred yet

const VARIANTS = {
  empty: {
    icon:      <IconInbox />,
    iconBg:    'bg-indigo-50',
    iconColor: 'text-indigo-400',
  },
  search: {
    icon:      <IconSearch />,
    iconBg:    'bg-slate-100',
    iconColor: 'text-slate-400',
  },
  favorites: {
    icon:      <IconStar />,
    iconBg:    'bg-amber-50',
    iconColor: 'text-amber-400',
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * EmptyState — displayed inside a grid when there is nothing to show.
 *
 * It always spans every column (col-span-full) so it fills the grid area.
 *
 * Props:
 *   variant     'empty' | 'search' | 'favorites'   icon + accent colour preset
 *   message     primary heading
 *   description supporting sentence below the heading
 *   action      optional CTA —
 *                 { label: string, to: string }      → renders a <Link>
 *                 { label: string, onClick: fn }     → renders a <button>
 */
export default function EmptyState({
  variant     = 'search',
  message     = 'Nothing here yet',
  description = 'Try adjusting your search or filters.',
  action,
}) {
  const { icon, iconBg, iconColor } = VARIANTS[variant] ?? VARIANTS.search

  return (
    // col-span-full makes this element stretch across all grid columns
    <div className="col-span-full">
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60">

        {/* Icon badge */}
        <div className={`w-20 h-20 ${iconBg} ${iconColor} rounded-2xl flex items-center justify-center mb-5 shadow-sm ring-1 ring-black/5`}>
          {icon}
        </div>

        {/* Heading */}
        <h3 className="text-lg font-semibold text-slate-700 mb-2">{message}</h3>

        {/* Supporting text */}
        <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-7">{description}</p>

        {/* Optional CTA — Link when `to` is given, button when `onClick` is given */}
        {action && (
          action.to ? (
            <Link
              to={action.to}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl border border-slate-200 shadow-sm transition-colors"
            >
              {action.label}
            </button>
          )
        )}

      </div>
    </div>
  )
}

