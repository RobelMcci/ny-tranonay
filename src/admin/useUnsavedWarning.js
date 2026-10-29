import { createElement, useCallback, useEffect } from 'react'
import { useBlocker } from 'react-router-dom'
import UnsavedDialog from './components/UnsavedDialog.jsx'
import { shouldBlock } from './unsaved.js'

/**
 * Protège les modifications non enregistrées d'un écran :
 * - fermeture ou rechargement de l'onglet : confirmation du navigateur (`beforeunload`) ;
 * - navigation dans l'application (menu, liens) : confirmation « Quitter sans enregistrer ? » (useBlocker).
 * Inactif quand `dirty` est faux (un enregistrement réussi rend donc la navigation libre).
 * @param {boolean} dirty
 * @returns {import('react').ReactElement} Dialogue de confirmation, à placer dans le rendu de l'écran.
 */
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

  const blockWhen = useCallback(({ currentLocation, nextLocation }) => shouldBlock(dirty, currentLocation, nextLocation), [dirty])
  const blocker = useBlocker(blockWhen)

  // Plus rien à protéger (enregistré entre-temps) : on libère une navigation restée en attente.
  useEffect(() => {
    if (blocker.state === 'blocked' && !dirty) blocker.reset()
  }, [blocker, dirty])

  return createElement(UnsavedDialog, { blocker })
}
