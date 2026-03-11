import { Link, useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-md mx-auto flex flex-col items-center text-center py-24 px-4">

      {/* ── Illustration ── */}
      <div className="relative mb-8 select-none">
        {/* Soft blurred backdrop circle */}
        <div className="absolute inset-0 rounded-full bg-indigo-100 blur-2xl opacity-60 scale-110" />

        {/* Icon card */}
        <div className="relative w-28 h-28 bg-white border border-slate-200 rounded-3xl shadow-sm flex items-center justify-center">
          <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* ── 404 label ── */}
      <p className="text-xs font-semibold tracking-widest uppercase text-indigo-400 mb-3">
        404 · Page not found
      </p>

      {/* ── Heading ── */}
      <h1 className="text-3xl font-bold text-slate-800 mb-3">
        Nothing here yet
      </h1>

      {/* ── Body ── */}
      <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-8">
        The page you're looking for doesn't exist or may have been moved.
        Head back home and keep building your prompt library.
      </p>

      {/* ── Actions ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <Link
          to="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-9 5v6h4v-6" />
          </svg>
          Go home
        </Link>

        <button
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-xl border border-slate-200 shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Go back
        </button>
      </div>

    </div>
  )
}
