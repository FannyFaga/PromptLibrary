import { useState } from 'react'
import { Link, Navigate, useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { usePrompts } from '../context/PromptContext'
import PromptForm from '../components/PromptForm'

export default function EditPromptPage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { prompts, editPrompt, isOwned } = usePrompts()
  const [submitting, setSubmitting] = useState(false)

  const prompt = prompts.find((p) => p.id === id)

  // Redirect if prompt not found or user doesn't own it
  if (!prompt || !isOwned(id)) return <Navigate to="/" replace />

  const handleEdit = async (formData) => {
    setSubmitting(true)
    try {
      await editPrompt(id, formData)
      toast.success(`"${formData.title}" updated!`)
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Failed to update — please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">All Prompts</Link>
        <span>/</span>
        <span className="text-slate-600 font-medium truncate max-w-[200px]">{prompt.title}</span>
        <span>/</span>
        <span className="text-slate-600 font-medium">Edit</span>
      </nav>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Prompt</h1>
          <p className="text-sm text-slate-500">
            Editing: <span className="font-medium text-slate-700">{prompt.title}</span>
          </p>
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <PromptForm key={prompt.id} initialData={prompt} onSubmit={handleEdit} mode="edit" />
      </div>

      {/* ── Helper tip ── */}
      <div className="mt-4 flex items-start gap-2 text-xs text-slate-400 px-1">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        Saving will overwrite the existing version. This action cannot be undone.
      </div>

    </div>
  )
}
