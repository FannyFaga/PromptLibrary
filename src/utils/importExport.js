import { generateId } from './helpers'

// The full set of valid categories. Imported prompts whose category is not
// in this list are silently coerced to 'Other' rather than crashing.
const VALID_CATEGORIES = ['Writing', 'Coding', 'Marketing', 'Productivity', 'Other']

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Serialise the prompts array to JSON and trigger a browser file download.
 *
 * How it works:
 *   1. JSON.stringify with 2-space indent → human-readable, re-importable
 *   2. Wrap in a Blob so the browser treats it as a downloadable file
 *   3. Create a temporary object URL, attach it to a hidden <a>, click it
 *   4. Immediately revoke the URL to free memory
 *
 * No server, no third-party library needed.
 *
 * @param {Array} prompts - the full prompts array from context
 */
export function exportPrompts(prompts) {
  const json   = JSON.stringify(prompts, null, 2)
  const blob   = new Blob([json], { type: 'application/json' })
  const url    = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const date   = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  anchor.href     = url
  anchor.download = `prompt-library-${date}.json`
  // Append → click → remove ensures the click works in Firefox and mobile
  // browsers that ignore .click() on elements outside the live DOM.
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url) // release the object URL immediately after click
}

// ─── Import — validation ──────────────────────────────────────────────────────

/**
 * Minimal validity check for a single raw item from the parsed JSON.
 * Only the two fields a prompt *cannot* function without are required.
 * Everything else has a safe default in normalizePrompt().
 *
 * @param  {*}       item
 * @returns {boolean}
 */
function isValidPrompt(item) {
  return (
    item !== null &&
    typeof item === 'object' &&
    typeof item.title === 'string' && item.title.trim() !== '' &&
    typeof item.text  === 'string' && item.text.trim()  !== ''
  )
}

/**
 * Convert a validated raw prompt into the app's canonical shape.
 *
 * Why re-generate the ID?
 *   If the user exports then re-imports, the IDs in the file already exist
 *   in the library. Re-generating ensures the imported copy is a distinct
 *   prompt and never silently overwrites an existing one.
 *
 * @param  {object} p - a raw prompt object that passed isValidPrompt()
 * @returns {object}  - a clean, fully-typed prompt ready for the store
 */
function normalizePrompt(p) {
  return {
    id:        generateId(),
    title:     p.title.trim(),
    text:      p.text.trim(),
    category:  VALID_CATEGORIES.includes(p.category) ? p.category : 'Other',
    tags:      Array.isArray(p.tags)
                 ? p.tags
                     .filter((t) => typeof t === 'string')
                     .map((t) => t.trim())
                     .filter(Boolean)
                 : [],
    favorite:  p.favorite === true,
    // Preserve the original date if it looks like an ISO string; otherwise stamp now
    createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString(),
  }
}

// ─── Import — file parsing ────────────────────────────────────────────────────

/**
 * Read a File object from an <input type="file"> and return a Promise that
 * resolves to the validated + normalised prompts ready to add to the store.
 *
 * Possible rejection reasons (all with user-readable .message):
 *   • Not a .json file
 *   • FileReader failure (disk error, permissions, etc.)
 *   • JSON.parse failure (malformed JSON)
 *   • Parsed value is not an array
 *   • Array contained no valid prompts at all
 *
 * Invalid array items are silently skipped; the caller receives a `skipped`
 * count and can show a partial-success message to the user.
 *
 * @param  {File} file
 * @returns {Promise<{ prompts: Array, skipped: number }>}
 */
export function parseImportFile(file) {
  return new Promise((resolve, reject) => {
    // ── Guard: only accept .json ──────────────────────────────────────────
    if (!file.name.toLowerCase().endsWith('.json')) {
      return reject(new Error('Please choose a .json file.'))
    }

    const reader = new FileReader()

    // ── FileReader error (e.g. file unreadable) ───────────────────────────
    reader.onerror = () => reject(new Error('Could not read the file.'))

    // ── Success: file bytes are in e.target.result ────────────────────────
    reader.onload = (e) => {
      // 1. Parse JSON — wrap in try/catch so a syntax error gives a clean message
      let parsed
      try {
        parsed = JSON.parse(e.target.result)
      } catch {
        return reject(new Error('Invalid JSON — the file could not be parsed.'))
      }

      // 2. Top-level must be an array
      if (!Array.isArray(parsed)) {
        return reject(new Error('Expected an array of prompts at the top level.'))
      }

      // 3. Filter to only items that have at least title + text
      const valid   = parsed.filter(isValidPrompt)
      const skipped = parsed.length - valid.length

      // 4. Reject if nothing survived validation
      if (valid.length === 0) {
        return reject(
          new Error('No valid prompts found. Each prompt needs a non-empty title and text.')
        )
      }

      // 5. Normalise all valid items and resolve
      resolve({ prompts: valid.map(normalizePrompt), skipped })
    }

    reader.readAsText(file)
  })
}
