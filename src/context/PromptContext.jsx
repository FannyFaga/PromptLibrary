import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import {
  getPrompts, insertPrompt, incrementCopyCount,
  updatePrompt as updatePromptApi,
  deletePrompt as deletePromptApi,
  verifyAdmin as verifyAdminApi,
} from '../lib/promptsApi'
import { useLocalStorage } from '../hooks/useLocalStorage'

// ─── Context ──────────────────────────────────────────────────────────────────
const PromptContext = createContext(null)

// ─── Edit-token helpers (localStorage) ────────────────────────────────────────
const TOKEN_KEY = 'prompt-library:edit-tokens'

function loadTokens() {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || '{}') }
  catch { return {} }
}
function saveToken(id, token) {
  const tokens = loadTokens()
  tokens[id] = token
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
}
function removeToken(id) {
  const tokens = loadTokens()
  delete tokens[id]
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
}
function getToken(id) {
  return loadTokens()[id] ?? null
}

// ─── Admin-token helpers (localStorage) ───────────────────────────────────────
const ADMIN_KEY = 'prompt-library:admin-token'

function loadAdminToken() {
  try { return localStorage.getItem(ADMIN_KEY) || '' }
  catch { return '' }
}
function saveAdminToken(token) { localStorage.setItem(ADMIN_KEY, token) }
function clearAdminToken()     { localStorage.removeItem(ADMIN_KEY) }

// ─── Provider ─────────────────────────────────────────────────────────────────
export function PromptProvider({ children }) {

  // ── Server state — loaded from Supabase ─────────────────────────────────
  const [prompts,  setPrompts]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  // ── Admin state ─────────────────────────────────────────────────────────
  const [adminToken, setAdminToken] = useState(loadAdminToken)
  const isAdmin = adminToken !== ''

  // ── Personal favorites — stored locally as a set of prompt IDs ──────────
  const [favoriteIds, setFavoriteIds] = useLocalStorage('prompt-library:favorites', [])

  // ── Load all prompts from Supabase on mount ──────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data, error: err } = await getPrompts()
      if (cancelled) return

      if (err) {
        setError(err.message ?? 'Failed to load prompts.')
        setLoading(false)
        return
      }

      setPrompts(data)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  // ── Merge personal favorites into the prompts array ─────────────────────
  const promptsWithFavorites = useMemo(
    () => prompts.map((p) => ({ ...p, favorite: favoriteIds.includes(p.id) })),
    [prompts, favoriteIds],
  )

  // ── Action: SUBMIT A PROMPT ──────────────────────────────────────────────
  async function addPrompt(data) {
    const { data: newPrompt, editToken, error: err } = await insertPrompt(data)
    if (err) throw new Error(err.message ?? 'Submission failed.')
    if (editToken) saveToken(newPrompt.id, editToken)
    setPrompts((prev) => [newPrompt, ...prev])
    return newPrompt
  }

  // ── Action: TOGGLE FAVORITE (local only) ────────────────────────────────
  function toggleFavorite(id) {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // ── Action: RECORD COPY ──────────────────────────────────────────────────
  async function recordCopy(id) {
    const { error: err } = await incrementCopyCount(id)
    if (!err) {
      setPrompts((prev) =>
        prev.map((p) => p.id === id ? { ...p, copyCount: (p.copyCount ?? 0) + 1 } : p)
      )
    }
  }

  // ── Action: EDIT PROMPT (token-verified OR admin) ────────────────────────
  async function editPrompt(id, data) {
    const token = getToken(id)
    if (!token && !isAdmin) throw new Error('You do not have permission to edit this prompt.')
    const { data: updated, error: err } = await updatePromptApi(id, data, token ?? '', adminToken)
    if (err) throw new Error(err.message ?? 'Update failed.')
    setPrompts((prev) =>
      prev.map((p) => p.id === id ? { ...updated, favorite: p.favorite } : p)
    )
    return updated
  }

  // ── Action: DELETE PROMPT (token-verified OR admin) ─────────────────────
  async function deletePromptFn(id) {
    const token = getToken(id)
    if (!token && !isAdmin) throw new Error('You do not have permission to delete this prompt.')
    const { error: err } = await deletePromptApi(id, token ?? '', adminToken)
    if (err) throw new Error(err.message ?? 'Delete failed.')
    removeToken(id)
    setPrompts((prev) => prev.filter((p) => p.id !== id))
  }

  // ── Helper: check if user can edit/delete a prompt ──────────────────────
  const isOwned = useCallback((id) => isAdmin || !!getToken(id), [isAdmin])

  // ── Admin: login / logout ───────────────────────────────────────────────
  async function loginAdmin(secret) {
    const { valid, error: err } = await verifyAdminApi(secret)
    if (err) throw new Error(err.message ?? 'Verification failed.')
    if (!valid) throw new Error('Invalid admin secret.')
    saveAdminToken(secret)
    setAdminToken(secret)
  }

  function logoutAdmin() {
    clearAdminToken()
    setAdminToken('')
  }

  return (
    <PromptContext.Provider
      value={{
        prompts: promptsWithFavorites,
        loading,
        error,
        addPrompt,
        toggleFavorite,
        recordCopy,
        editPrompt,
        deletePrompt: deletePromptFn,
        isOwned,
        isAdmin,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </PromptContext.Provider>
  )
}

// ─── Custom hook ──────────────────────────────────────────────────────────────
export function usePrompts() {
  const context = useContext(PromptContext)
  if (!context) throw new Error('usePrompts must be used inside <PromptProvider>')
  return context
}
