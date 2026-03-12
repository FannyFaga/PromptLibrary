import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORIES } from '../data/defaultPrompts'

// ── Constants ────────────────────────────────────────────────────────────────
const FORM_CATEGORIES = CATEGORIES.filter((c) => c !== 'All')
const TITLE_MAX = 80
const TEXT_MAX  = 2000
const CUSTOM_CAT_MAX = 30

// ── Helper: tags string ↔ array ──────────────────────────────────────────────
const tagsToString = (tags) => (Array.isArray(tags) ? tags.join(', ') : tags || '')

// Split by comma → trim whitespace → lowercase → remove duplicates → drop empties
const stringToTags = (str) =>
  [...new Set(str.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))]

// ── Validation rules ─────────────────────────────────────────────────────────
function validate(form) {
  const errors = {}
  if (!form.title.trim())
    errors.title = 'Title is required.'
  else if (form.title.length > TITLE_MAX)
    errors.title = `Title must be ${TITLE_MAX} characters or fewer.`
  if (!form.category)
    errors.category = 'Please select a category.'
  else if (form.category === 'Other' && !form.customCategory.trim())
    errors.customCategory = 'Please specify your custom category.'
  else if (form.category === 'Other' && form.customCategory.length > CUSTOM_CAT_MAX)
    errors.customCategory = `Category name must be ${CUSTOM_CAT_MAX} characters or fewer.`
  if (!form.text.trim())
    errors.text = 'Prompt content is required.'
  else if (form.text.length > TEXT_MAX)
    errors.text = `Prompt content must be ${TEXT_MAX} characters or fewer.`
  return errors
}

// ── Sub-components ───────────────────────────────────────────────────────────

/** Red asterisk shown next to required field labels */
function Required() {
  return <span className="text-red-500 ml-0.5">*</span>
}

/** Inline error message shown below a field */
function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </p>
  )
}

/** Live #tag chip pills */
function TagPreview({ tagsString }) {
  const tags = stringToTags(tagsString)
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-2" aria-label="Tag preview">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-xs font-medium ring-1 ring-indigo-100"
        >
          <span className="text-indigo-400">#</span>{tag}
        </span>
      ))}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

/**
 * PromptForm — reusable controlled form for creating and editing prompts.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Props                                                                   │
 * ├──────────────┬──────────────────┬───────────────────────────────────────┤
 * │  initialData │ object (optional)│ Pre-fills every field. Pass the full  │
 * │              │                  │ prompt object when editing.           │
 * ├──────────────┼──────────────────┼───────────────────────────────────────┤
 * │  onSubmit    │ (data) => void   │ Called with the validated form data:  │
 * │              │ (required)       │ { title, category, tags[], text }     │
 * ├──────────────┼──────────────────┼───────────────────────────────────────┤
 * │  mode        │ 'add' | 'edit'   │ Controls button label and header cue. │
 * │              │ default: 'add'   │                                       │
 * └──────────────┴──────────────────┴───────────────────────────────────────┘
 *
 * Usage — ADD mode:
 *   <PromptForm onSubmit={(data) => dispatch({ type: 'ADD', payload: data })} />
 *
 * Usage — EDIT mode:
 *   <PromptForm
 *     initialData={existingPrompt}
 *     onSubmit={(data) => dispatch({ type: 'EDIT', payload: { ...data, id } })}
 *     mode="edit"
 *   />
 */
export default function PromptForm({ initialData = {}, onSubmit, mode = 'add' }) {
  const navigate = useNavigate()

  // ── Controlled state ────────────────────────────────────────────────────
  // If the existing prompt has a category not in the predefined list, treat it
  // as a custom "Other" category and prefill the custom field.
  const isCustomInit = initialData.category && !FORM_CATEGORIES.includes(initialData.category)
  const [form, setForm] = useState({
    title:          initialData.title    || '',
    category:       isCustomInit ? 'Other' : (initialData.category || ''),
    customCategory: isCustomInit ? initialData.category : '',
    tags:           tagsToString(initialData.tags),
    text:           initialData.text     || '',
  })

  // errors  — validation messages keyed by field name
  // touched — tracks whether a field has been blurred at least once
  const [errors,  setErrors]  = useState({})
  const [touched, setTouched] = useState({})

  // ── Handlers ────────────────────────────────────────────────────────────

  /** Update state; re-validate the changed field only if it was already touched */
  const handleChange = (e) => {
    const { name, value } = e.target
    const next = { ...form, [name]: value }
    // Clear custom category when switching to a non-Other category
    if (name === 'category' && value !== 'Other') {
      next.customCategory = ''
    }
    setForm(next)
    if (touched[name]) {
      const errs = validate(next)
      setErrors((prev) => ({ ...prev, [name]: errs[name] || '' }))
    }
    // Also re-validate customCategory when category changes
    if (name === 'category' && touched.customCategory) {
      const errs = validate(next)
      setErrors((prev) => ({ ...prev, customCategory: errs.customCategory || '' }))
    }
  }

  /** Mark a field as touched and validate it immediately on blur */
  const handleBlur = (e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const errs = validate(form)
    setErrors((prev) => ({ ...prev, [name]: errs[name] || '' }))
  }

  /** Validate everything on submit; mark all fields touched so errors show */
  const handleSubmit = (e) => {
    e.preventDefault()
    const allTouched = Object.fromEntries(
      Object.keys(form).map((k) => [k, true])
    )
    setTouched(allTouched)
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    // Resolve the final category — use custom text when "Other" was picked
    const finalCategory = form.category === 'Other' && form.customCategory.trim()
      ? form.customCategory.trim()
      : form.category

    onSubmit({
      title: form.title,
      category: finalCategory,
      tags: stringToTags(form.tags),
      text: form.text,
    })
  }

  // ── Shared style helpers ─────────────────────────────────────────────────
  const inputBase = [
    'w-full px-4 py-3 border rounded-xl text-slate-700 placeholder-slate-400',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
    'transition text-sm',
  ].join(' ')

  const fieldState = (name) =>
    errors[name] && touched[name]
      ? 'border-red-400 bg-red-50'
      : 'border-slate-200 bg-white hover:border-slate-300'

  const titleLeft = TITLE_MAX - form.title.length
  const textLeft  = TEXT_MAX  - form.text.length

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

      {/* ── Required note ── */}
      <p className="text-xs text-slate-400">
        Fields marked <span className="text-red-500 font-medium">*</span> are required.
      </p>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TITLE                                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <label htmlFor="title" className="text-sm font-medium text-slate-700">
            Title <Required />
          </label>
          {/* Character counter — turns red when over limit */}
          <span
            className={`text-xs tabular-nums ${
              titleLeft < 0 ? 'text-red-500 font-semibold' : 'text-slate-400'
            }`}
          >
            {form.title.length} / {TITLE_MAX}
          </span>
        </div>

        <input
          id="title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="e.g. Blog Post Writer"
          maxLength={TITLE_MAX + 10} /* allow typing past limit so error shows */
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
          className={`${inputBase} ${fieldState('title')}`}
        />
        <FieldError id="title-error" message={touched.title ? errors.title : ''} />
        {!errors.title && (
          <p className="mt-1 text-xs text-slate-400">
            A short, descriptive name for your prompt.
          </p>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* CATEGORY                                                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1.5">
          Category <Required />
        </label>

        {/* Custom styled select */}
        <div className="relative">
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? 'category-error' : undefined}
            className={`${inputBase} ${fieldState('category')} appearance-none cursor-pointer pr-10`}
          >
            {/* Placeholder — disabled so it can't be re-selected after picking a real one */}
            <option value="" disabled>Select a category…</option>
            {FORM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {/* Chevron icon */}
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <FieldError id="category-error" message={touched.category ? errors.category : ''} />

        {/* ── Custom category input (shown when "Other" is selected) ── */}
        {form.category === 'Other' && (
          <div className="mt-3">
            <label htmlFor="customCategory" className="block text-sm font-medium text-slate-700 mb-1.5">
              Custom Category Name <Required />
            </label>
            <input
              id="customCategory"
              name="customCategory"
              type="text"
              value={form.customCategory}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. Design, Education, Finance…"
              maxLength={CUSTOM_CAT_MAX + 5}
              aria-invalid={!!errors.customCategory}
              aria-describedby={errors.customCategory ? 'customCategory-error' : undefined}
              className={`${inputBase} ${fieldState('customCategory')}`}
            />
            <FieldError id="customCategory-error" message={touched.customCategory ? errors.customCategory : ''} />
            {!(errors.customCategory && touched.customCategory) && (
              <p className="mt-1 text-xs text-slate-400">
                Enter the category that best describes your prompt.
              </p>
            )}
          </div>
        )}

        {!(errors.category && touched.category) && form.category !== 'Other' && (
          <p className="mt-1 text-xs text-slate-400">
            Choose the category that best fits this prompt.
          </p>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAGS                                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1.5">
          Tags
          <span className="ml-1.5 text-xs font-normal text-slate-400">— optional, comma-separated</span>
        </label>

        <input
          id="tags"
          name="tags"
          type="text"
          value={form.tags}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="e.g. writing, SEO, blog"
          className={`${inputBase} ${fieldState('tags')}`}
        />

        {/* Live chip preview */}
        <TagPreview tagsString={form.tags} />

        {form.tags.trim() === '' && (
          <p className="mt-1 text-xs text-slate-400">
            Tags help you search and filter prompts quickly.
          </p>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* PROMPT TEXT                                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <label htmlFor="text" className="text-sm font-medium text-slate-700">
            Prompt Text <Required />
          </label>
          {/* Character counter */}
          <span
            className={`text-xs tabular-nums ${
              textLeft < 0 ? 'text-red-500 font-semibold' : textLeft < 200 ? 'text-amber-500' : 'text-slate-400'
            }`}
          >
            {form.text.length} / {TEXT_MAX}
          </span>
        </div>

        <textarea
          id="text"
          name="text"
          value={form.text}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Write your prompt here… use [placeholders] for variable parts."
          rows={7}
          aria-invalid={!!errors.text}
          className={`${inputBase} ${fieldState('text')} resize-none leading-relaxed`}
        />

        {/* Progress bar — fills as you type, turns amber near the limit, red when over */}
        <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              textLeft < 0
                ? 'bg-red-400'
                : textLeft < 200
                ? 'bg-amber-400'
                : 'bg-indigo-400'
            }`}
            style={{ width: `${Math.min((form.text.length / TEXT_MAX) * 100, 100)}%` }}
          />
        </div>

        <FieldError message={touched.text ? errors.text : ''} />

        {!(errors.text && touched.text) && (
          <p className="mt-1 text-xs text-slate-400">
            Tip: wrap variable parts in <code className="bg-slate-100 px-1 rounded">[brackets]</code> so
            they stand out when you copy the prompt.
          </p>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ACTIONS                                                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          {mode === 'add' ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Prompt
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>

    </form>
  )
}
