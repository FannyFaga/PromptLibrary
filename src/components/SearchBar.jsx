import { useRef, useEffect } from 'react'

/**
 * SearchBar — controlled search input with keyboard shortcuts.
 *
 * Props:
 *   value     {string}    controlled value
 *   onChange  {function}  called with the new string on every keystroke
 *
 * Keyboard shortcuts:
 *   /         → focus the input from anywhere on the page
 *   Escape    → clear the input and blur
 */
export default function SearchBar({ value, onChange }) {
  const inputRef = useRef(null)

  // ── Global keyboard shortcut ────────────────────────────────────────────
  // '/'    → focus the input (same UX as GitHub, Linear, Notion).
  // Escape → clear the query and release focus.
  // The tagName guards prevent hijacking focus while the user is already
  // typing in another field (e.g. the Add Prompt form).
  useEffect(() => {
    function handleKey(e) {
      if (
        e.key === '/' &&
        e.target.tagName !== 'INPUT' &&
        e.target.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()           // stop the browser's built-in '/' quick-find
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        onChange('')
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey) // cleanup on unmount
  }, [onChange])

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">

        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by title, tag, or content…"
          aria-label="Search prompts"
          className="w-full pl-10 pr-24 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition"
        />

        {/* Right side: clear button OR keyboard shortcut hint */}
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center gap-2">
          {value ? (
            // ── Active: show an × clear button ──
            <button
              onClick={() => onChange('')}
              aria-label="Clear search"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            // ── Idle: show the / shortcut hint ──
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-400 text-xs font-mono">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* ── Search scope pills ── */}
      {/* Always visible so users know upfront what fields are being searched */}
      <div className="flex items-center gap-1.5 px-1">
        <span className="text-xs text-slate-400">Searching in:</span>
        {[
          { label: 'Title',   icon: 'T' },
          { label: 'Tags',    icon: '#' },
          { label: 'Content', icon: '¶' },
        ].map(({ label, icon }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium"
          >
            <span className="text-slate-400 font-mono text-[10px]">{icon}</span>
            {label}
          </span>
        ))}
        <span className="ml-auto text-xs text-slate-300 font-mono hidden sm:block">Esc to clear</span>
      </div>
    </div>
  )
}
