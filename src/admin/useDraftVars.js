import { useCallback, useEffect, useState } from 'react'
import { fetchDraft } from './api.js'
import { availableVars } from './draft-vars.js'

/**
 * Charge les variables de texte du brouillon (`{{prix.…}}`, `{{tel}}`…).
 * `state` : `{ status: 'loading' | 'ready' | 'error', vars, complete }`. Un échec n'empêche pas d'enregistrer des textes sans variable.
 */
export function useDraftVars() {
  const [state, setState] = useState({ status: 'loading', vars: {}, complete: true })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchDraft()
      .then((draft) => {
        if (!cancelled) setState({ status: 'ready', ...availableVars(draft) })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', vars: {}, complete: false })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading', vars: {}, complete: true })
    setAttempt((n) => n + 1)
  }, [])

  return { state, retry }
}
