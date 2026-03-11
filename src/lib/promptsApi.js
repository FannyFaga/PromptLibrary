/**
 * promptsApi.js
 *
 * All Supabase operations for the prompts table.
 * snake_case DB columns are normalised to camelCase here so the rest of the
 * codebase never has to know about the DB column naming convention.
 */

import { supabase } from './supabase'

// Explicit column list — intentionally excludes edit_token so it is never
// returned to clients on general listing queries.
const PROMPT_COLUMNS = 'id, title, category, tags, text, copy_count, created_at'

// ─── Normaliser ───────────────────────────────────────────────────────────────
// Converts a raw Supabase row → the shape the UI expects.
// `favorite` is always false here — PromptContext merges it from localStorage.
function normalize(row) {
  return {
    id:        row.id,
    title:     row.title,
    category:  row.category,
    tags:      Array.isArray(row.tags) ? row.tags : [],
    text:      row.text,
    copyCount: row.copy_count ?? 0,
    createdAt: row.created_at,
    favorite:  false,
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────
export async function getPrompts() {
  const { data, error } = await supabase
    .from('prompts')
    .select(PROMPT_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error }
  return { data: data.map(normalize), error: null }
}

// ─── Insert one ───────────────────────────────────────────────────────────────
// Returns { data, editToken, error } — the editToken is saved locally so the
// submitter can later edit / delete their prompt.
export async function insertPrompt(prompt) {
  const { data, error } = await supabase
    .from('prompts')
    .insert({
      title:    prompt.title.trim(),
      category: prompt.category ?? 'Other',
      tags:     Array.isArray(prompt.tags) ? prompt.tags : [],
      text:     prompt.text.trim(),
    })
    .select()          // returns ALL columns — including edit_token
    .single()

  if (error) return { data: null, editToken: null, error }
  return { data: normalize(data), editToken: data.edit_token, error: null }
}

// ─── Increment copy count (via RPC — bypasses immutability RLS) ───────────────
export async function incrementCopyCount(id) {
  const { error } = await supabase.rpc('increment_copy_count', { prompt_id: id })
  return { error }
}

// ─── Update prompt (RPC — verifies edit_token or admin secret server-side) ────
export async function updatePrompt(id, prompt, editToken, adminToken = '') {
  const { data, error } = await supabase.rpc('update_prompt', {
    p_id:          id,
    p_edit_token:  editToken,
    p_title:       prompt.title.trim(),
    p_category:    prompt.category ?? 'Other',
    p_tags:        Array.isArray(prompt.tags) ? prompt.tags : [],
    p_text:        prompt.text.trim(),
    p_admin_token: adminToken,
  })

  if (error) return { data: null, error }
  return { data: normalize(data), error: null }
}

// ─── Delete prompt (RPC — verifies edit_token or admin secret server-side) ────
export async function deletePrompt(id, editToken, adminToken = '') {
  const { error } = await supabase.rpc('delete_prompt', {
    p_id:          id,
    p_edit_token:  editToken,
    p_admin_token: adminToken,
  })
  return { error }
}

// ─── Verify admin secret (RPC) ────────────────────────────────────────────────
export async function verifyAdmin(token) {
  const { data, error } = await supabase.rpc('verify_admin', { p_token: token })
  if (error) return { valid: false, error }
  return { valid: !!data, error: null }
}
