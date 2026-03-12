import { useMemo, useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePrompts } from '../context/PromptContext'
import AdminMenu from './AdminMenu'

/* ── Hamburger / X icon ────────────────────────────────────────────────────── */
function MenuIcon({ open }) {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  )
}

export default function Navbar() {
  const { pathname } = useLocation()
  const { prompts } = usePrompts()
  const favCount = useMemo(() => prompts.filter((p) => p.favorite).length, [prompts])
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileRef = useRef(null)

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Close on outside click
  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setMobileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileOpen])

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e) => { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileOpen])

  const linkBase = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors'
  const active   = 'bg-indigo-50 text-indigo-600'
  const inactive = 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'

  // Mobile-specific styles (full-width links)
  const mobileLinkBase = 'block w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors'
  const mobileActive   = 'bg-indigo-50 text-indigo-600'
  const mobileInactive = 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'

  return (
    <nav ref={mobileRef} className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="text-xl font-bold text-slate-800">
              Prompt <span className="text-indigo-600">Library</span>
            </span>
          </Link>

          {/* ── Desktop nav links (hidden on mobile) ── */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`${linkBase} ${pathname === '/' ? active : inactive}`}
            >
              All Prompts
            </Link>

            <Link
              to="/favorites"
              className={`${linkBase} flex items-center gap-1.5 ${
                pathname === '/favorites' ? active : inactive
              }`}
            >
              ★ Favorites
              {favCount > 0 && (
                <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center leading-none">
                  {favCount}
                </span>
              )}
            </Link>

            <Link
              to="/add"
              className="ml-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              + Submit Prompt
            </Link>

            {/* Admin login/logout */}
            <div className="ml-1 pl-2 border-l border-slate-200">
              <AdminMenu />
            </div>
          </div>

          {/* ── Mobile hamburger button (hidden on desktop) ── */}
          <div className="flex items-center gap-2 md:hidden">
            <AdminMenu />
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <MenuIcon open={mobileOpen} />
            </button>
          </div>

        </div>
      </div>

      {/* ── Mobile dropdown menu ─────────────────────────────────────────── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-200 ease-in-out ${
          mobileOpen ? 'max-h-72 border-t border-slate-200' : 'max-h-0'
        }`}
      >
        <div className="px-4 py-3 space-y-1">
          <Link
            to="/"
            className={`${mobileLinkBase} ${pathname === '/' ? mobileActive : mobileInactive}`}
          >
            📋  All Prompts
          </Link>

          <Link
            to="/favorites"
            className={`${mobileLinkBase} flex items-center gap-2 ${
              pathname === '/favorites' ? mobileActive : mobileInactive
            }`}
          >
            ★  Favorites
            {favCount > 0 && (
              <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center leading-none">
                {favCount}
              </span>
            )}
          </Link>

          <Link
            to="/add"
            className="block w-full text-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            + Submit Prompt
          </Link>
        </div>
      </div>
    </nav>
  )
}
