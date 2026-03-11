import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { copyToClipboard, extractTokens } from '../utils/helpers'
import { usePrompts } from '../context/PromptContext'
import PromptDetailModal from './PromptDetailModal'
import FillPromptModal from './FillPromptModal'
import ConfirmModal from './ConfirmModal'
import { CATEGORY_BADGE, CATEGORY_ACCENT } from '../utils/categories'

// ─── SVG Icons ───────────────────────────────────────────────────────────────
function IconCopy() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
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

function IconEdit() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

/**
 * PromptCard — displays a single prompt with all its details and actions.
 *
 * Required prop:
 *   prompt  {object}
 *     ├── id        {string}   unique identifier
 *     ├── title     {string}   prompt name shown as card heading
 *     ├── category  {string}   e.g. 'Writing', 'Coding' — drives the badge colour
 *     ├── tags      {string[]} optional array of short keyword tags
 *     ├── text      {string}   full prompt body (previewed as 3 lines)
 *     └── favorite  {boolean}  whether the star is filled
 *
 * The component reads dispatch() from PromptContext itself, so no callbacks
 * need to be passed down from the parent — just pass the prompt object.
 */
export default function PromptCard({ prompt, onTagClick }) {
  const { toggleFavorite, recordCopy, deletePrompt, isOwned } = usePrompts()
  const [copied,             setCopied]             = useState(false)
  const [showDetailModal,    setShowDetailModal]    = useState(false)
  const [showFillModal,      setShowFillModal]      = useState(false)
  const [showDeleteConfirm,  setShowDeleteConfirm]  = useState(false)

  // Stores the setTimeout handle so we can cancel it if the card unmounts
  // before the 2-second copy-feedback window expires.
  const copyTimerRef = useRef(null)
  useEffect(() => () => clearTimeout(copyTimerRef.current), [])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    // Prompts with [placeholder] tokens open the fill-in form first.
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

  const owned     = isOwned(prompt.id)
  const badgeStyle = CATEGORY_BADGE[prompt.category] ?? CATEGORY_BADGE.Other
  const tags       = Array.isArray(prompt.tags) ? prompt.tags : []
  // True for prompts created in the last 7 days — drives the "New" badge.
  const isNew      = Date.now() - new Date(prompt.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000

  return (
    <article
      onClick={() => setShowDetailModal(true)}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col cursor-pointer"
    >

      {/* ═══ Top colour accent bar driven by category ═══ */}
      <div className={`h-1 rounded-t-2xl ${CATEGORY_ACCENT[prompt.category] ?? 'bg-slate-300'}`} />

      <div className="p-5 flex flex-col gap-3 flex-1">

        {/* ── Header row: title + favorite ── */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-slate-800 text-[15px] leading-snug line-clamp-2 flex-1">
            {prompt.title}
          </h3>

          {/* Favorite toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(prompt.id) }}
            aria-label={prompt.favorite ? 'Remove from favorites' : 'Add to favorites'}
            title={prompt.favorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`flex-shrink-0 p-1 rounded-lg transition-all hover:scale-110 ${
              prompt.favorite
                ? 'text-amber-400 hover:text-amber-500'
                : 'text-slate-300 hover:text-amber-400'
            }`}
          >
            <IconStar filled={prompt.favorite} />
          </button>
        </div>

        {/* ── Category badge + “New” indicator ── */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${
              badgeStyle
            }`}
          >
            {prompt.category}
          </span>
          {isNew && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold ring-1 ring-emerald-100">
              New
            </span>
          )}
        </div>

        {/* ── Tags — clickable when onTagClick is provided ── */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) =>
              onTagClick ? (
                <button
                  key={tag}
                  onClick={(e) => { e.stopPropagation(); onTagClick(tag) }}
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

        {/* ── Prompt text preview ── */}
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 flex-1">
          {prompt.text}
        </p>

        {/* ── Character count ── */}
        <p className="text-[11px] text-slate-300 font-mono">
          {prompt.text.length} chars
        </p>

      </div>

      {/* ── Action bar ── */}
      <div onClick={(e) => e.stopPropagation()} className="px-5 pb-4 flex items-center gap-2">

        {/* Copy */}
        <button
          onClick={handleCopy}
          aria-label="Copy prompt to clipboard"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            copied
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
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
              aria-label="Edit prompt"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
            >
              <IconEdit /> Edit
            </Link>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Delete prompt"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              <IconTrash /> Delete
            </button>
          </>
        )}

      </div>

      {/* ── Detail modal (portaled to <body>) ── */}
      <PromptDetailModal
        prompt={prompt}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onTagClick={onTagClick
          ? (tag) => { setShowDetailModal(false); onTagClick(tag) }
          : undefined
        }
      />

      {/* ── Fill-in modal — opens instead of direct copy when prompt has [tokens] ── */}
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

      {/* ── Delete confirmation ── */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Prompt"
        message={`Are you sure you want to delete "${prompt.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

    </article>
  )
}
