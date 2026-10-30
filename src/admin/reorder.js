// Aides d'ordonnancement des listes (fonctions pures, sans effet de bord).

const inRange = (index, length) => Number.isInteger(index) && index >= 0 && index < length

/**
 * Déplace l'élément d'indice `from` à l'indice `to`. Renvoie toujours un nouveau tableau ;
 * des indices hors bornes laissent le contenu inchangé. L'entrée n'est jamais modifiée.
 * @template T
 * @param {T[]} items
 * @param {number} from
 * @param {number} to
 * @returns {T[]}
 */
export function moveItem(items, from, to) {
  const next = [...items]
  if (from === to || !inRange(from, next.length) || !inRange(to, next.length)) return next
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/**
 * Ajoute à chaque élément sa position (0 … n−1) dans de nouveaux objets.
 * @template T
 * @param {T[]} items
 * @returns {(T & { position: number })[]}
 */
export function withPositions(items) {
  return items.map((item, position) => ({ ...item, position }))
}
