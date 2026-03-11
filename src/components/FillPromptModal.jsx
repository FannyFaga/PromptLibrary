import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { copyToClipboard, extractTokens } from '../utils/helpers'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Replace every [token] in text with the value the user typed.
 * Tokens left empty are kept as-is so the user knows they forgot something.
 */
function assemblePrompt(text, values) {
  return text.replace(/\[([^\]]+)\]/g, (_, token) =>
    values[token]?.trim() ? values[token].trim() : `[${token}]`
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * FillPromptModal — shown when a prompt contains [placeholder] tokens.
 *
 * Renders one labeled input per unique token, a live preview that highlights
 * filled (indigo) and unfilled (amber) placeholders, then copies the fully
 * assembled prompt to the clipboard on confirm.
 *
 * Why a portal?
 *   Same reason as ConfirmModal: PromptCard has hover:-translate-y-0.5 which
 *   creates a new stacking context. Any fixed child would be clipped or
 *   mis-positioned inside it. Portaling to <body> sidesteps this entirely.
 *
 * Props:
 *   prompt   {object}        the prompt being copied
 *   isOpen   {boolean}
 *   onClose  {() => void}    called on cancel / Escape / backdrop click
 *   onCopy   {() => void}    called AFTER a successful clipboard write
 *                            (lets the parent record usage, flash the button, etc.)
 */
export default function FillPromptModal({ prompt, isOpen, onClose, onCopy }) {
  // Derive unique tokens once per prompt identity change.
  const tokens = useMemo(
    () => extractTokens(prompt?.text ?? ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prompt?.id, prompt?.text],
  )

  // One controlled input per token, keyed by token name.
  const [values, setValues] = useState({})

  // Reset every input when the modal opens or the prompt changes.
  useEffect(() => {
    if (isOpen) setValues(Object.fromEntries(tokens.map((t) => [t, ''])))
  }, [isOpen, prompt?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Close on Escape ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const handle = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [isOpen, onClose])

  // ── Scroll lock (wasAlreadyLocked — same pattern as ConfirmModal) ──────────
  // This modal can open from inside PromptDetailModal which already holds the
  // lock. Checking wasAlreadyLocked prevents double-release on close.
  useEffect(() => {
    if (!isOpen) return
    const wasAlreadyLocked = document.body.style.overflow === 'hidden'
    if (!wasAlreadyLocked) document.body.style.overflow = 'hidden'
    return () => { if (!wasAlreadyLocked) document.body.style.overflow = '' }
  }, [isOpen])

  // ── Derived state ──────────────────────────────────────────────────────────
  const assembled = useMemo(
    () => (prompt ? assemblePrompt(prompt.text, values) : ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prompt?.text, values],
  )
  const allFilled = tokens.every((t) => values[t]?.trim())

  // ── Copy handler ───────────────────────────────────────────────────────────
  const handleCopy = async () => {
    const ok = await copyToClipboard(assembled)
    if (ok) {
      toast.success('Prompt copied!')
      onCopy?.()   // let parent record usage / flash its copy button
      onClose()
    } else {
      toast.error('Copy failed — please try again.')
    }
  }

  if (!isOpen || !prompt) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fill-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      {/* ── Panel (stopPropagation prevents backdrop-click from closing) ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 id="fill-modal-title" className="text-base font-semibold text-slate-800">
              Fill in placeholders
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{prompt.title}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">

          {/* One labeled input per unique token */}
          <div className="flex flex-col gap-3">
            {tokens.map((token, i) => (
              <div key={token}>
                <label
                  htmlFor={`fill-${token}`}
                  className="block text-sm font-medium text-slate-700 mb-1.5 capitalize"
                >
                  {token.replace(/-/g, ' ')}
                </label>
                <input
                  id={`fill-${token}`}
                  autoFocus={i === 0}
                  type="text"
                  value={values[token] ?? ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [token]: e.target.value }))
                  }
                  placeholder={`Enter ${token}…`}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            ))}
          </div>

          {/* ── Live preview ── */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Preview
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-600 leading-relaxed max-h-44 overflow-y-auto whitespace-pre-wrap">
              {/*
                Split the raw text on [token] boundaries.
                  • Filled tokens  → indigo highlight with the user's value
                  • Unfilled tokens → amber highlight with the original [token]
                  • Plain text      → rendered as-is
              */}
              {prompt.text.split(/(\[[^\]]+\])/g).map((part, i) => {
                const match = part.match(/^\[([^\]]+)\]$/)
                if (!match) return <span key={i}>{part}</span>
                const token  = match[1]
                const filled = values[token]?.trim()
                return filled ? (
                  <mark key={i} className="bg-indigo-100 text-indigo-700 rounded px-0.5 not-italic font-medium">
                    {filled}
                  </mark>
                ) : (
                  <mark key={i} className="bg-amber-100 text-amber-700 rounded px-0.5 not-italic">
                    {part}
                  </mark>
                )
              })}
            </div>

            {/* Warning shown while any token remains empty */}
            {!allFilled && (
              <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Unfilled placeholders will be copied as-is
              </p>
            )}
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="flex gap-3 px-6 pb-5 pt-4 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Copy prompt
          </button>
        </div>

      </div>
    </div>,
    document.body,
  )
}
