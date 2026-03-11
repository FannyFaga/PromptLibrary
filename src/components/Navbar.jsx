import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePrompts } from '../context/PromptContext'
import AdminMenu from './AdminMenu'

export default function Navbar() {
  const { pathname } = useLocation()
  const { prompts } = usePrompts()
  const favCount = useMemo(() => prompts.filter((p) => p.favorite).length, [prompts])

  const linkBase = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors'
  const active   = 'bg-indigo-50 text-indigo-600'
  const inactive = 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
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

          {/* ── Nav links ── */}
          <div className="flex items-center gap-1">
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

        </div>
      </div>
    </nav>
  )
}
