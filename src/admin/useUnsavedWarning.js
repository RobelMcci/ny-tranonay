import { useEffect } from 'react'

/** Demande confirmation au navigateur avant de quitter la page tant que des modifications ne sont pas enregistrées. */
export function useUnsavedWarning(dirty) {
  useEffect(() => {
    if (!dirty) return undefined
    const handler = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])
}
