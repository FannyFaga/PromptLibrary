import { useState, useCallback } from 'react'

/**
 * useLocalStorage(key, fallback, validate?)
 *
 * A drop-in replacement for useState that also keeps the value in localStorage.
 * Works exactly like useState — but the value survives page refreshes.
 *
 * @param {string}    key       localStorage key, e.g. 'prompt-library:prompts'
 * @param {*}         fallback  Returned when localStorage is empty or broken.
 * @param {Function}  [validate] Optional fn(parsed) → boolean.
 *                               If it returns false the fallback is used instead.
 *                               Use this to reject outdated data shapes.
 * @returns {[value, set, remove]}
 *   value  — current value (same as useState)
 *   set    — update fn; supports functional updaters: set(prev => ...)
 *   remove — wipe the localStorage key and reset state to fallback
 */
export function useLocalStorage(key, fallback, validate) {

  // ────────────────────────────────────────────────────────────────
  // STEP 1 — READ from localStorage on first render only
  // The function passed to useState() is called once on mount ("lazy initialiser").
  // After that React ignores it and uses its own state internally.
  // ────────────────────────────────────────────────────────────────
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key)

      // Case A: key doesn’t exist yet — first time the app runs
      if (raw === null) return fallback

      // Case B: key exists — parse the stored JSON string back to a value
      const parsed = JSON.parse(raw)

      // Case C: optional shape check — if the stored data looks wrong
      //         (e.g. you added a required field in a code update), reject it
      //         and fall back to the default so the app never breaks.
      if (validate && !validate(parsed)) {
        console.warn(`useLocalStorage: "${key}" failed validation, resetting to fallback.`)
        return fallback
      }

      return parsed
    } catch {
      // Case D: JSON.parse threw (corrupt data) or localStorage is blocked
      //         (some browsers block it in private mode) — fall back safely.
      return fallback
    }
  })

  // ────────────────────────────────────────────────────────────────
  // STEP 2 — WRITE to localStorage every time the value changes
  //
  // Key design decision: the write happens INSIDE setValue’s callback.
  // This gives us the latest “current” value even when functional updaters
  // (set(prev => ...)) are used in fast succession — preventing stale
  // closure bugs that the simpler approach `set(nextValue)` would have.
  // ────────────────────────────────────────────────────────────────
  const set = useCallback((nextValue) => {
    setValue((current) => {
      // Resolve functional updaters: set(prev => [...prev, newItem])
      const resolved =
        typeof nextValue === 'function' ? nextValue(current) : nextValue

      // Persist the resolved value to localStorage
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved))
      } catch (err) {
        // QuotaExceededError (code 22 in some browsers) means storage is full.
        // Dispatch a custom event so App.jsx can show a visible toast without
        // this hook needing to import react-hot-toast directly.
        if (err.name === 'QuotaExceededError' || err.code === 22) {
          window.dispatchEvent(new CustomEvent('storage-quota-exceeded'))
        }
        console.warn(`useLocalStorage: could not save "${key}"`, err)
      }

      // Return the new value to React so the component re-renders
      return resolved
    })
  }, [key])

  // ────────────────────────────────────────────────────────────────
  // STEP 3 — REMOVE from localStorage (e.g. “Reset to defaults”)
  // Deletes the key from localStorage and resets React state to the fallback.
  // ────────────────────────────────────────────────────────────────
  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
    } catch (err) {
      console.warn(`useLocalStorage: could not remove "${key}"`, err)
    }
    setValue(fallback)
  }, [key, fallback])

  return [value, set, remove]
}
