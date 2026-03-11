import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { usePrompts } from '../context/PromptContext'
import PromptForm from '../components/PromptForm'

export default function AddPromptPage() {
  const { addPrompt } = usePrompts()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const handleAdd = async (formData) => {
    setSubmitting(true)
    try {
      await addPrompt(formData)
      toast.success(`"${formData.title}" submitted!`)
      navigate('/')
    } catch {
      toast.error('Failed to submit — please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">All Prompts</Link>
        <span>/</span>
        <span className="text-slate-600 font-medium">Submit a Prompt</span>
      </nav>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Submit a Prompt</h1>
          <p className="text-sm text-slate-500">Fill in the details and contribute to the community library.</p>
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <PromptForm onSubmit={handleAdd} mode="add" />
      </div>

      {/* ── Helper tip ── */}
      <div className="mt-4 flex items-start gap-2 text-xs text-slate-400 px-1">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Your prompt will be visible to everyone in the community library.
      </div>

    </div>
  )
}
