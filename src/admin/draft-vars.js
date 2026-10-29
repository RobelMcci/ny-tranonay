// Variables de texte disponibles dans le brouillon, et vérification des `{{…}}` d'un texte (fonctions pures).
import { buildVars, unknownTokens } from '../lib/interpolate.js'
import { checkTokens } from './validation.js'

/**
 * Variables réellement disponibles pour un brouillon : celles dont la valeur existe
 * (sans informations générales, `tel`, `email`… ne le sont pas).
 * @param {object | null | undefined} draft Contenu au format « Content » (`fetchDraft`).
 * @returns {{ vars: Record<string, string>, complete: boolean }} `complete` : false si les informations générales sont absentes.
 */
export function availableVars(draft) {
  const all = buildVars(draft ?? {})
  const vars = Object.fromEntries(Object.entries(all).filter(([, value]) => typeof value === 'string'))
  return { vars, complete: Boolean(draft?.settings) }
}

/**
 * Problème de variables dans un texte, ou `null`. Tant que les variables ne sont pas connues (chargement ou échec),
 * un texte sans `{{…}}` reste enregistrable ; un texte avec `{{…}}` est refusé avec une explication.
 * @param {{ status: 'loading' | 'ready' | 'error', vars: Record<string, string> }} state
 * @param {unknown} text
 * @returns {string | null}
 */
export function tokenProblem(state, text) {
  if (state.status === 'ready') return checkTokens([text], state.vars)
  if (typeof text !== 'string' || unknownTokens(text, {}).length === 0) return null
  return state.status === 'loading'
    ? 'Les variables du site sont en cours de chargement : réessayez dans un instant.'
    : 'Les variables du site n’ont pas pu être chargées : impossible de vérifier ce texte. Réessayez ou retirez la variable.'
}
