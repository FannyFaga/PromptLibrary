import { useRef } from 'react'
import toast from 'react-hot-toast'
import { usePrompts } from '../context/PromptContext'
import { exportPrompts, parseImportFile } from '../utils/importExport'

function IconDownload() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

function IconUpload() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}

/**
 * ImportExportMenu — two compact buttons for exporting and importing prompts.
 *
 * Export: serialises the live prompts array to a timestamped JSON file and
 *         triggers a browser download — no server required.
 *
 * Import: opens a file picker restricted to .json files. On selection the
 *         file is parsed and validated client-side. Valid prompts are appended
 *         to the existing library (non-destructive merge). Invalid items are
 *         skipped and reported in the toast message.
 *
 * The file input is hidden and imperatively clicked via a ref, which lets us
 * style the trigger button freely while keeping the input accessible.
 */
export default function ImportExportMenu() {
  const { prompts, importPrompts } = usePrompts()
  const fileInputRef = useRef(null)

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (prompts.length === 0) {
      toast.error('Nothing to export — your library is empty.')
      return
    }
    exportPrompts(prompts)
    toast.success(`${prompts.length} prompt${prompts.length !== 1 ? 's' : ''} exported!`)
  }

  // ── Import ────────────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset the input value so the user can re-select the same file later
    // (browsers don't fire onChange if the same path is chosen twice otherwise)
    e.target.value = ''

    try {
      const { prompts: incoming, skipped } = await parseImportFile(file)
      await importPrompts(incoming)

      const msg = skipped > 0
        ? `Imported ${incoming.length} prompt${incoming.length !== 1 ? 's' : ''} (${skipped} skipped — missing title or text).`
        : `${incoming.length} prompt${incoming.length !== 1 ? 's' : ''} imported!`

      toast.success(msg, { duration: skipped > 0 ? 5000 : 3000 })
    } catch (err) {
      toast.error(err.message)
    }
  }

  const btnBase = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors'

  return (
    <div className="flex items-center gap-1">

      {/* Export */}
      <button
        onClick={handleExport}
        title={`Export all ${prompts.length} prompts as JSON`}
        aria-label="Export prompts"
        className={`${btnBase} text-slate-600 hover:text-indigo-600 hover:bg-indigo-50`}
      >
        <IconDownload />
        Export
      </button>

      {/* Import — the real work happens in the hidden <input> */}
      <button
        onClick={() => fileInputRef.current?.click()}
        title="Import prompts from a JSON file"
        aria-label="Import prompts"
        className={`${btnBase} text-slate-600 hover:text-emerald-600 hover:bg-emerald-50`}
      >
        <IconUpload />
        Import
      </button>

      {/* Hidden file input — triggered imperatively so the button can be styled */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
