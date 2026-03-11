import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * ConfirmModal — reusable confirmation dialog rendered in a React portal.
 *
 * Why a portal?
 *   The modal uses `position: fixed` to cover the whole screen.
 *   Any ancestor element with a CSS `transform` creates a new stacking
 *   context and breaks fixed positioning for its children. PromptCard has
 *   `hover:-translate-y-0.5`, so if the modal were rendered inside the card
 *   it would be clipped and mis-positioned. Portaling to <body> sidesteps
 *   this entirely while keeping the component logically part of PromptCard.
 *
 * Props:
 *   isOpen       {boolean}             controls visibility
 *   title        {string}              dialog heading
 *   message      {string}              supporting body text
 *   onConfirm    {() => void}          called on confirm button click
 *   onCancel     {() => void}          called on cancel / Escape / backdrop click
 *   confirmLabel {string}              confirm button text  (default: "Delete")
 *   variant      {'danger'|'primary'}  confirm button colour (default: 'danger')
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  variant      = 'danger',
}) {
  // ── Close on Escape ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onCancel])

  // ── Lock body scroll while open ────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    // Check if a parent modal already holds the lock before we touch it.
    // If it does, we must NOT release it when this modal closes — doing so
    // would let the body scroll while the parent (e.g. PromptDetailModal)
    // is still open.
    const wasAlreadyLocked = document.body.style.overflow === 'hidden'
    if (!wasAlreadyLocked) document.body.style.overflow = 'hidden'
    return () => { if (!wasAlreadyLocked) document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const confirmStyle =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'

  return createPortal(
    // ── Backdrop ──────────────────────────────────────────────────────────────
    // Clicking the backdrop (but NOT the panel) triggers onCancel.
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      {/* ── Panel ─────────────────────────────────────────────────────────── */}
      {/* stopPropagation prevents clicks inside the panel from closing it. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-5"
      >

        {/* ── Header: icon + text ─────────────────────────────────────────── */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h8a1 1 0 011 1v1a1 1 0 01-1 1H6z"
              />
            </svg>
          </div>

          <div>
            <h2
              id="confirm-modal-title"
              className="text-base font-semibold text-slate-800"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="flex gap-3 justify-end">
          {/* autoFocus on Cancel so Enter doesn't accidentally confirm */}
          <button
            autoFocus
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmStyle}`}
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>,
    document.body,   // render outside the card to escape its transform context
  )
}
