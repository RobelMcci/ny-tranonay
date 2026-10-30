// Charge le contenu publié depuis Supabase.
// Par défaut, tout échec se replie sur le seed (le build local, les aperçus et une base vide se construisent toujours).
// En mode strict (production Netlify, voir `isStrictBuild`), tout échec SAUF « aucun instantané publié » lève
// `ContentLoadError` : le build s'arrête et Netlify garde le déploiement précédent au lieu de remettre le seed en ligne.
import { validateContent } from '../../src/data/content-schema.js'

const TIMEOUT_MS = 10000
const MAX_ERRORS_LOGGED = 3

/** Échec de chargement du contenu en mode strict (le message est en français et ne contient jamais de clé). */
export class ContentLoadError extends Error {
  /** @param {string} reason */
  constructor(reason) {
    super(`contenu : ${reason}`)
    this.name = 'ContentLoadError'
    this.reason = reason
  }
}

const isSet = (value) => typeof value === 'string' && value.trim() !== ''

/**
 * Le build doit-il échouer plutôt que se replier sur le seed ? Oui seulement en production Netlify
 * (`NETLIFY=true` et `CONTEXT=production`) quand `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont définies,
 * sauf échappatoire `CONTENT_ALLOW_SEED_FALLBACK=1` (ou `true`).
 * @param {Record<string, string | undefined> | undefined} env
 * @returns {boolean}
 */
export function isStrictBuild(env) {
  const allowFallback = String(env?.CONTENT_ALLOW_SEED_FALLBACK ?? '').trim().toLowerCase()
  if (allowFallback === '1' || allowFallback === 'true') return false
  const onNetlifyProduction = env?.NETLIFY === 'true' && env?.CONTEXT === 'production'
  return onNetlifyProduction && isSet(env?.SUPABASE_URL) && isSet(env?.SUPABASE_ANON_KEY)
}

/**
 * @param {Object} options
 * @param {Record<string, string | undefined>} options.env     SUPABASE_URL, SUPABASE_ANON_KEY
 * @param {typeof fetch} options.fetchImpl
 * @param {() => object | Promise<object>} options.readSeed    renvoie le seed parsé
 * @param {(message: string) => void} options.log              reçoit les avertissements
 * @param {boolean} [options.strict]                           vrai : lever `ContentLoadError` au lieu de se replier
 *   (sauf tableau vide = aucun instantané publié, qui se replie toujours sur le seed)
 * @returns {Promise<{ content: object, source: 'supabase' | 'seed' }>}
 */
export async function loadContent({ env, fetchImpl, readSeed, log, strict = false }) {
  const fallback = async (reason) => {
    log(`contenu : ${reason}, repli sur le seed`)
    return { content: await readSeed(), source: 'seed' }
  }
  const fail = (reason) => {
    if (strict) throw new ContentLoadError(reason)
    return fallback(reason)
  }

  const baseUrl = (env?.SUPABASE_URL ?? '').trim().replace(/\/+$/, '')
  const anonKey = (env?.SUPABASE_ANON_KEY ?? '').trim()
  if (!baseUrl || !anonKey) return fail('SUPABASE_URL ou SUPABASE_ANON_KEY absente')

  let response
  try {
    response = await fetchImpl(`${baseUrl}/rest/v1/published_content?select=id,payload&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError'
    const detail = timedOut ? `délai de ${TIMEOUT_MS / 1000} s dépassé` : (error?.message ?? String(error))
    return fail(`Supabase injoignable (${detail})`)
  }

  if (!response.ok) return fail(`Supabase a répondu HTTP ${response.status}`)

  let rows
  try {
    rows = await response.json()
  } catch (error) {
    return fail(`réponse Supabase illisible (${error?.message ?? error})`)
  }

  if (!Array.isArray(rows)) return fail('réponse Supabase inattendue (tableau attendu)')
  const row = rows[0]
  // Base vide (aucune publication encore) : le seed est le bon contenu, y compris en production.
  if (!row) return fallback('aucun instantané publié')

  const content = { ...row.payload, version: row.id }
  const errors = validateContent(content)
  if (errors.length > 0) {
    const shown = errors.slice(0, MAX_ERRORS_LOGGED).join(' ; ')
    const more = errors.length > MAX_ERRORS_LOGGED ? ` (+${errors.length - MAX_ERRORS_LOGGED})` : ''
    return fail(`instantané publié invalide : ${shown}${more}`)
  }

  return { content, source: 'supabase' }
}
