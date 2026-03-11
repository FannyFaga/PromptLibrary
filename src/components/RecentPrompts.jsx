import { useMemo } from 'react'
import { getRecentPrompts } from '../utils/helpers'
import PromptCard from './PromptCard'

// How many prompts to show in the strip.
// Change this one constant to adjust the count everywhere.
const RECENT_COUNT = 5

function IconClock() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" strokeWidth={1.75} strokeLinecap="round" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 7v5l3 3" />
    </svg>
  )
}

/**
 * RecentPrompts — a horizontal scroll strip showing the N most recently
 * created prompts.
 *
 * Design decisions:
 * • Reuses PromptCard directly — no duplicated card markup.
 * • Each card gets a fixed min-width so the strip scrolls instead of
 *   squashing cards on narrow viewports.
 * • snap-x gives a smooth paged feel on touch devices.
 * • Only rendered when the library has more than RECENT_COUNT prompts;
 *   if everything fits on one screen a "recently added" strip is redundant.
 * • A visual separator below it cleanly divides the strip from the main grid.
 *
 * Props:
 *   prompts  {Array}  the full, unfiltered prompt array from context
 */
export default function RecentPrompts({ prompts }) {
  // Derive the recent slice — memoised so it only re-sorts when prompts change.
  const recent = useMemo(() => getRecentPrompts(prompts, RECENT_COUNT), [prompts])

  // Only worth showing when the library has more prompts than we display;
  // if the total fits in the main grid already the strip would just repeat everything.
  if (prompts.length <= RECENT_COUNT) return null

  return (
    <section aria-label="Recently added prompts">

      {/* ── Section header ── */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0">
          <IconClock />
        </div>
        <h2 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">
          Recently Added
        </h2>
        <span className="text-xs text-slate-400 font-normal normal-case">
          — last {recent.length}
        </span>
      </div>

      {/* ── Horizontal scroll strip ── */}
      {/*
        -mx-1 px-1: nudge the track so the first card's shadow isn't clipped
        snap-x snap-mandatory: smooth paged scrolling on mobile
        scrollbar-hide: hides the browser scrollbar (still scrollable via touch/trackpad)
      */}
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory">
        {recent.map((prompt) => (
          /*
            min-w-[300px]: prevents the card from shrinking below a readable size
            flex-shrink-0: stops flexbox from squashing it
            snap-start: each card aligns to the left edge on snap
          */
          <div
            key={prompt.id}
            className="min-w-[300px] max-w-[340px] flex-shrink-0 snap-start"
          >
            <PromptCard prompt={prompt} />
          </div>
        ))}
      </div>

      {/* ── Visual divider between strip and main grid ── */}
      <div className="mt-2 flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">All Prompts</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

    </section>
  )
}
