import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { copyToClipboard, extractTokens } from '../utils/helpers'
import { usePrompts } from '../context/PromptContext'
import FillPromptModal from './FillPromptModal'
import ConfirmModal from './ConfirmModal'
import { CATEGORY_BADGE, CATEGORY_ACCENT } from '../utils/categories'

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconX() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function IconStar({ filled }) {
  return filled ? (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function IconCopy() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return null
  const date = new Date(iso)
  // Guard against non-ISO strings like "yesterday" that pass the typeof check
  // in normalizePrompt but produce Invalid Date objects.
  if (isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * PromptDetailModal — full-detail sheet for a single prompt.
 *
 * Rendered in a React portal (same reason as ConfirmModal: the card that
 * owns this modal has a CSS transform which would break `position: fixed`
 * for any descendant rendered inside the card's DOM subtree).
 *
 * Props:
 *   prompt   {object}      the prompt to display
 *   isOpen   {boolean}     controls visibility
 *   onClose  {() => void}  called on Escape / backdrop / ✕ button
 */
export default function PromptDetailModal({ prompt, isOpen, onClose, onTagClick }) {
  const { toggleFavorite, recordCopy, deletePrompt, isOwned } = usePrompts()
  const [copied,            setCopied]            = useState(false)
  const [showFillModal,     setShowFillModal]     = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const copyTimerRef = useRef(null)
  useEffect(() => () => clearTimeout(copyTimerRef.current), [])

  // ── Close on Escape — but only when the nested ConfirmModal is NOT open,
  //    so Escape closes ConfirmModal first, then PromptDetailModal on the
  //    next press, rather than both at once.
  useEffect(() => {
    if (!isOpen || showFillModal || showDeleteConfirm) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose, showFillModal, showDeleteConfirm])

  // ── Body scroll lock (wasAlreadyLocked — consistent with ConfirmModal) ───────────
  useEffect(() => {
    if (!isOpen) return
    const wasAlreadyLocked = document.body.style.overflow === 'hidden'
    if (!wasAlreadyLocked) document.body.style.overflow = 'hidden'
    return () => { if (!wasAlreadyLocked) document.body.style.overflow = '' }
  }, [isOpen])

  const handleCopy = async () => {
    if (extractTokens(prompt.text).length > 0) {
      setShowFillModal(true)
      return
    }
    const ok = await copyToClipboard(prompt.text)
    if (ok) {
      setCopied(true)
      recordCopy(prompt.id)
      toast.success('Copied to clipboard!')
      clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error('Copy failed — please try again.')
    }
  }

  const handleDelete = async () => {
    try {
      await deletePrompt(prompt.id)
      toast.success(`"${prompt.title}" deleted!`)
    } catch (err) {
      toast.error(err.message || 'Failed to delete.')
      setShowDeleteConfirm(false)
    }
  }

  if (!isOpen || !prompt) return null

  const owned       = isOwned(prompt.id)

  const badgeStyle  = CATEGORY_BADGE[prompt.category]  ?? CATEGORY_BADGE.Other
  const accentStyle = CATEGORY_ACCENT[prompt.category] ?? 'bg-slate-300'
  const tags        = Array.isArray(prompt.tags) ? prompt.tags : []
  const createdAt   = formatDate(prompt.createdAt)

  return createPortal(
    // ── Backdrop ──────────────────────────────────────────────────────────────
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto"
    >
      {/* ── Panel ─────────────────────────────────────────────────────────── */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl flex flex-col my-auto"
      >

        {/* ── Category accent bar ───────────────────────────────────────── */}
        <div className={`h-1.5 rounded-t-2xl flex-shrink-0 ${accentStyle}`} />

        {/* ── Header: title · favorite · close ──────────────────────────── */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4 border-b border-slate-100">
          <h2
            id="detail-modal-title"
            className="text-lg font-bold text-slate-800 leading-snug flex-1"
          >
            {prompt.title}
          </h2>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Favorite */}
            <button
              onClick={() => toggleFavorite(prompt.id)}
              aria-label={prompt.favorite ? 'Remove from favorites' : 'Add to favorites'}
              title={prompt.favorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-1.5 rounded-lg transition-all hover:scale-110 ${
                prompt.favorite
                  ? 'text-amber-400 hover:text-amber-500'
                  : 'text-slate-300 hover:text-amber-400'
              }`}
            >
              <IconStar filled={prompt.favorite} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Close details"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <IconX />
            </button>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Meta: category badge + created date */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${badgeStyle}`}
            >
              {prompt.category}
            </span>

            {createdAt && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <IconCalendar />
                {createdAt}
              </span>
            )}
          </div>

          {/* Tags — clickable when onTagClick provided (closes modal + applies filter) */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) =>
                onTagClick ? (
                  <button
                    key={tag}
                    onClick={() => onTagClick(tag)}
                    title={`Filter by #${tag}`}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <span className="text-slate-400">#</span>{tag}
                  </button>
                ) : (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-medium"
                  >
                    <span className="text-slate-400">#</span>{tag}
                  </span>
                )
              )}
            </div>
          )}

          {/* Full prompt text — scrollable box so very long prompts don't
              push the action buttons off screen */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-64 overflow-y-auto">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {prompt.text}
            </p>
          </div>

          {/* Character count */}
          <p className="text-[11px] text-slate-300 font-mono -mt-2">
            {prompt.text.length} characters
          </p>

        </div>

        {/* ── Footer: action buttons ─────────────────────────────────────── */}
        <div className="px-6 pb-5 pt-1 border-t border-slate-100 flex items-center gap-2">

          {/* Copy */}
          <button
            onClick={handleCopy}
            aria-label="Copy prompt to clipboard"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              copied
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {copied ? <IconCheck /> : <IconCopy />}
            {copied ? 'Copied!' : 'Copy'}
          </button>

          {/* Owner-only actions */}
          {owned && (
            <>
              <Link
                to={`/edit/${prompt.id}`}
                onClick={onClose}
                aria-label="Edit prompt"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <IconEdit /> Edit
              </Link>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Delete prompt"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
              >
                <IconTrash /> Delete
              </button>
            </>
          )}

        </div>
      </div>

      {/* ── Delete confirmation ──────────────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Prompt"
        message={`Are you sure you want to delete "${prompt.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* ── Fill-in modal ────────────────────────────────────────────────── */}
      <FillPromptModal
        prompt={prompt}
        isOpen={showFillModal}
        onClose={() => setShowFillModal(false)}
        onCopy={() => {
          setCopied(true)
          recordCopy(prompt.id)
          clearTimeout(copyTimerRef.current)
          copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
        }}
      />

    </div>,
    document.body,
  )
}
