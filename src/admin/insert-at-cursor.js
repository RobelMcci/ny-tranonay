// Insertion de texte à la position du curseur d'un champ (fonction pure, sans accès au DOM).

/**
 * @param {string} value Valeur actuelle du champ.
 * @param {number | null | undefined} selectionStart Début de la sélection (`null` si inconnu : fin du texte).
 * @param {number | null | undefined} selectionEnd Fin de la sélection.
 * @param {string} text Texte à insérer ; il remplace la sélection.
 * @returns {{ value: string, caret: number }} Nouvelle valeur et position du curseur après le texte inséré.
 */
export function insertAtCursor(value, selectionStart, selectionEnd, text) {
  const clamp = (n) => (Number.isInteger(n) ? Math.min(Math.max(n, 0), value.length) : value.length)
  const a = clamp(selectionStart)
  const b = clamp(selectionEnd)
  const start = Math.min(a, b)
  const end = Math.max(a, b)
  return { value: value.slice(0, start) + text + value.slice(end), caret: start + text.length }
}
