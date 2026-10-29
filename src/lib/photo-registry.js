// Registre des photos : fonctions pures (aucun import Vite) pour rester testables sous Node.
// Les `maps` sont les résultats des import.meta.glob de images.js, indexés par chemin `../assets/<file>.jpg`.

const has = (object, key) => Object.prototype.hasOwnProperty.call(object ?? {}, key)

/**
 * @typedef {{ src: string, srcSet: string, width: number, height: number, alt: string, category: string }} Photo
 */

/**
 * Construit le registre `clé → photo`. Une ligne dont le fichier est absent des `maps`
 * (photo téléversée mais jamais synchronisée, fichier supprimé) est ignorée et signalée.
 * @param {Array<{ key: string, file: string | null, alt: string, category: string, width: number, height: number }>} rows
 * @param {{ srcsets: Record<string, string>, fallbacks: Record<string, string> }} maps
 * @returns {Record<string, Photo>}
 */
export function buildRegistry(rows, { srcsets, fallbacks }) {
  const registry = {}
  for (const { key, file, alt, category, width, height } of rows ?? []) {
    const path = `../assets/${file}.jpg`
    if (!file || !has(srcsets, path) || !has(fallbacks, path)) {
      console.warn(`photo « ${key} » ignorée : fichier introuvable (${path})`)
      continue
    }
    registry[key] = { src: fallbacks[path], srcSet: srcsets[path], width, height, alt, category }
  }
  return registry
}

/**
 * Résout un emplacement (clé de `defaults`) ou une clé de photo directe.
 * Emplacement : surcharge, sinon photo par défaut. Photo absente du registre : photo par défaut
 * de l'emplacement, puis première photo du registre. Ne lève jamais ; `undefined` si le registre est vide.
 * @param {string} nameOrSlot
 * @param {Record<string, Photo>} registry
 * @param {Record<string, string>} [overrides]  emplacement → clé de photo
 * @param {Record<string, string>} [defaults]   emplacement → clé de photo par défaut
 * @returns {Photo | undefined}
 */
export function resolvePhoto(nameOrSlot, registry, overrides = {}, defaults = {}) {
  const isSlot = has(defaults, nameOrSlot)
  const wanted = isSlot ? (has(overrides, nameOrSlot) ? overrides[nameOrSlot] : defaults[nameOrSlot]) : nameOrSlot
  const candidates = [wanted, isSlot ? defaults[nameOrSlot] : undefined]
  for (const key of candidates) {
    if (typeof key === 'string' && has(registry, key)) return registry[key]
  }
  const first = Object.keys(registry ?? {})[0]
  return first === undefined ? undefined : registry[first]
}
