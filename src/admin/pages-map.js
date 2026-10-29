// Référencement : conversion ligne SQL ⇄ objet et validation de saisie. Fonctions pures, sans accès réseau.
import { toDecimal } from './validation.js'

export const MAX_TITLE = 120
export const MAX_DESCRIPTION = 300
export const MAX_NAV_LABEL = 40

/**
 * @typedef {object} PageSeo
 * @property {string} path
 * @property {string} title
 * @property {string} description
 * @property {number} priority
 * @property {string | null} navLabel
 */

/** @returns {PageSeo} */
export function pageFromRow(row) {
  return { path: row.path, title: row.title, description: row.description, priority: Number(row.priority), navLabel: row.nav_label ?? null }
}

/** @param {PageSeo} page */
export function pageToRow(page) {
  return { path: page.path, title: page.title, description: page.description, priority: page.priority, nav_label: page.navLabel }
}

/**
 * Priorité du plan du site : de 0 à 1, une décimale au plus (`0.8`, `0,8` et `1` sont acceptés).
 * @param {string | number} input
 * @returns {{ ok: true, value: number } | { ok: false, error: string }}
 */
export function parsePriority(input) {
  const message = 'La priorité doit être un nombre de 0 à 1, avec une décimale au plus (exemple : 0,8).'
  const value = toDecimal(input)
  if (!Number.isFinite(value) || value < 0 || value > 1) return { ok: false, error: message }
  if (Math.round(value * 10) / 10 !== value) return { ok: false, error: message }
  return { ok: true, value }
}

/**
 * Contrôle la saisie d'une page (`priority` peut être du texte). Les limites de longueur ici sont les limites dures ;
 * les recommandations de référencement (60 / 160 caractères) ne sont que des avertissements (`seoPreview`).
 * @returns {{ title?: string, description?: string, priority?: string, navLabel?: string }}
 */
export function validatePageSeo(page) {
  const errors = {}
  const title = String(page.title ?? '').trim()
  if (title === '') errors.title = 'Le titre est obligatoire.'
  else if (title.length > MAX_TITLE) errors.title = `Le titre ne peut pas dépasser ${MAX_TITLE} caractères.`
  const description = String(page.description ?? '').trim()
  if (description === '') errors.description = 'La description est obligatoire.'
  else if (description.length > MAX_DESCRIPTION) errors.description = `La description ne peut pas dépasser ${MAX_DESCRIPTION} caractères.`
  const priority = parsePriority(page.priority)
  if (!priority.ok) errors.priority = priority.error
  const navLabel = String(page.navLabel ?? '').trim()
  if (navLabel.length > MAX_NAV_LABEL) errors.navLabel = `Le libellé ne peut pas dépasser ${MAX_NAV_LABEL} caractères.`
  return errors
}
