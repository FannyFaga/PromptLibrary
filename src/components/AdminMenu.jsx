import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { usePrompts } from '../context/PromptContext'

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconLock() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

/**
 * AdminMenu — a small dropdown in the navbar for admin login/logout.
 *
 * When logged out:  shows a lock icon → opens a secret input form
 * When logged in:   shows a green shield + "Admin" badge → click to log out
 */
export default function AdminMenu() {
  const { isAdmin, loginAdmin, logoutAdmin } = usePrompts()
  const [open,    setOpen]    = useState(false)
  const [secret,  setSecret]  = useState('')
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!secret.trim()) return
    setLoading(true)
    try {
      await loginAdmin(secret.trim())
      toast.success('Admin mode activated!')
      setOpen(false)
      setSecret('')
    } catch (err) {
      toast.error(err.message || 'Invalid secret.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logoutAdmin()
    toast.success('Admin mode deactivated.')
    setOpen(false)
  }

  // ── Admin is logged in ──────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition-colors"
          title="Admin mode active"
        >
          <IconShield />
          Admin
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg p-3 z-50">
            <p className="text-xs text-slate-500 mb-2">You have full control over all prompts.</p>
            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              Log out of Admin
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Admin is logged out ─────────────────────────────────────────────────
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        title="Admin login"
        aria-label="Admin login"
      >
        <IconLock />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-lg p-4 z-50">
          <p className="text-xs font-medium text-slate-700 mb-2">Admin Access</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-2">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter admin secret"
              autoFocus
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !secret.trim()}
              className="w-full px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {loading ? 'Verifying…' : 'Login'}
            </button>
          </form>
          <p className="text-[10px] text-slate-400 mt-2">Only the project owner has this secret.</p>
        </div>
      )}
    </div>
  )
}
