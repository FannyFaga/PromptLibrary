import { useMemo } from 'react'
import { Link } from 'react-router-dom'

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconStack() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )
}

function IconStar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
}

function IconTag() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  )
}

function IconCopy() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Single stat tile ──────────────────────────────────────────────────────────

/**
 * A single stat tile. Optionally wraps in a <Link> when `to` is provided.
 *
 * Props:
 *   icon    ReactNode   icon element
 *   label   string      description below the number
 *   value   number      the big number to show
 *   color   string      Tailwind color token: 'indigo' | 'amber' | 'violet' | 'emerald'
 *   to      string?     if given, the whole tile becomes a router link
 */
function StatTile({ icon, label, value, color, to, onClick }) {
  // Tailwind needs complete class strings — no dynamic construction — so we
  // map each color token to the full set of classes used in this tile.
  const palette = {
    indigo:  { bg: 'bg-indigo-50',  icon: 'text-indigo-500',  num: 'text-indigo-700'  },
    amber:   { bg: 'bg-amber-50',   icon: 'text-amber-500',   num: 'text-amber-700'   },
    violet:  { bg: 'bg-violet-50',  icon: 'text-violet-500',  num: 'text-violet-700'  },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500', num: 'text-emerald-700' },
  }
  const c = palette[color] ?? palette.indigo

  const inner = (
    <div className="flex items-center gap-4">
      {/* Icon badge */}
      <div className={`w-11 h-11 rounded-xl ${c.bg} ${c.icon} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      {/* Text */}
      <div>
        <p className={`text-2xl font-bold tabular-nums leading-none ${c.num}`}>{value}</p>
        <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
      </div>
    </div>
  )

  const base = 'block bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm transition-shadow cursor-pointer hover:shadow-md'

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={base}>
        {inner}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={`${base} w-full text-left`}>
      {inner}
    </button>
  )
}

// ── StatsBar ──────────────────────────────────────────────────────────────────

/**
 * StatsBar — a 4-tile overview row shown at the top of the home page.
 *
 * All four values are derived from the `prompts` array:
 *   • Total prompts      — prompts.length
 *   • Favorites          — prompts where p.favorite === true
 *   • Categories in use  — distinct category values in the library (excludes 'All')
 *   • Added this week    — prompts created in the last 7 days
 *
 * Props:
 *   prompts  {Array}  the full unfiltered prompt array from context
 */
export default function StatsBar({ prompts, onClickCategories, onClickCopies }) {
  const stats = useMemo(() => {
    const totalFavorites  = prompts.filter((p) => p.favorite).length

    // Count only categories that actually appear in the library,
    // not the full CATEGORIES constant — gives a more accurate "in use" count.
    const usedCategories  = new Set(prompts.map((p) => p.category)).size

    // Total clipboard copies across the entire library — shows real engagement.
    const totalCopies     = prompts.reduce((sum, p) => sum + (p.copyCount ?? 0), 0)

    return { totalFavorites, usedCategories, totalCopies }
  }, [prompts])

  return (
    // 2 columns on mobile, 4 on sm+ so tiles never get too narrow
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatTile
        icon={<IconStack />}
        label="Total Prompts"
        value={prompts.length}
        color="indigo"
        to="/"
      />
      <StatTile
        icon={<IconStar />}
        label="Favorites"
        value={stats.totalFavorites}
        color="amber"
        to="/favorites"
      />
      <StatTile
        icon={<IconTag />}
        label="Categories Used"
        value={stats.usedCategories}
        color="violet"
        onClick={onClickCategories}
      />
      <StatTile
        icon={<IconCopy />}
        label="Total Copies"
        value={stats.totalCopies}
        color="emerald"
        onClick={onClickCopies}
      />
    </div>
  )
}
