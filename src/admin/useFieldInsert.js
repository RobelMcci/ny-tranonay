import { useCallback, useEffect, useRef, useState } from 'react'
import { insertAtCursor } from './insert-at-cursor.js'

const isTextField = (node) => node?.tagName === 'TEXTAREA' || (node?.tagName === 'INPUT' && node.type === 'text')

/**
 * Insertion d'une variable `{{…}}` à la position du curseur du champ texte où l'on écrivait.
 * - `trackFocus` : à brancher en `onFocus` sur un conteneur (le focus remonte) pour mémoriser le dernier champ texte actif.
 * - `insert(token, fieldIds)` : insère dans le dernier champ actif parmi `fieldIds` (sinon dans le premier) ;
 *   `apply(fieldId, value)` doit alors enregistrer la nouvelle valeur ; le focus et le curseur sont replacés après l'affichage.
 *
 * @param {(fieldId: string, value: string) => void} apply
 */
export function useFieldInsert(apply) {
  const lastId = useRef(null)
  const pending = useRef(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const target = pending.current
    if (!target) return
    pending.current = null
    const element = document.getElementById(target.id)
    if (!element) return
    element.focus()
    element.setSelectionRange(target.caret, target.caret)
  }, [tick])

  const trackFocus = useCallback((event) => {
    if (isTextField(event.target) && event.target.id) lastId.current = event.target.id
  }, [])

  const insert = (token, fieldIds) => {
    const id = fieldIds.includes(lastId.current) ? lastId.current : fieldIds[0]
    const element = document.getElementById(id)
    if (!isTextField(element)) return
    const { value, caret } = insertAtCursor(element.value, element.selectionStart, element.selectionEnd, token)
    apply(id, value)
    pending.current = { id, caret }
    setTick((n) => n + 1)
  }

  return { trackFocus, insert }
}
