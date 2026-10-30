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

const byPositionThenKey = (a, b) => {
  const pa = a.galleryPosition ?? Infinity
  const pb = b.galleryPosition ?? Infinity
  if (pa !== pb) return pa < pb ? -1 : 1
  return a.key < b.key ? -1 : a.key > b.key ? 1 : 0
}

/**
 * Clés de la galerie : photos du registre ayant une position, triées par position puis par clé
 * (indépendant de l'ordre des lignes renvoyé par la base).
 */
export function galleryKeysOf(rows, registry) {
  return (rows ?? [])
    .filter((row) => row.galleryPosition != null && has(registry, row.key))
    .sort(byPositionThenKey)
    .map((row) => row.key)
}

/** Clés des chambres : catégorie `Chambres`, triées par position (sans position en dernier) puis par clé. */
export function roomPhotoKeysOf(rows, registry) {
  return (rows ?? [])
    .filter((row) => row.category === 'Chambres' && has(registry, row.key))
    .sort(byPositionThenKey)
    .map((row) => row.key)
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

/**
 * Photo de la carte d'une chambre (page Chambres) : la première photo choisie pour elle dans le tableau de bord
 * (`photoKeys`) qui existe dans le registre ; sinon le comportement historique (chambre `twin` → emplacement
 * `chambres.1`, les autres sans photo).
 * @param {{ id: string, photoKeys?: string[] }} room
 * @param {Record<string, Photo>} registry
 * @returns {string | null} clé de photo ou emplacement, `null` si la carte n'a pas de photo.
 */
export function roomCardPhoto(room, registry) {
  const chosen = (room?.photoKeys ?? []).find((key) => typeof key === 'string' && has(registry, key))
  if (chosen) return chosen
  return room?.id === 'twin' ? 'chambres.1' : null
}
