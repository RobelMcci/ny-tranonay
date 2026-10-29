// Charge le contenu publié depuis Supabase ; tout échec se replie sur le seed (le build ne doit jamais casser).
import { validateContent } from '../../src/data/content-schema.js'

const TIMEOUT_MS = 10000
const MAX_ERRORS_LOGGED = 3

/**
 * @param {Object} options
 * @param {Record<string, string | undefined>} options.env     SUPABASE_URL, SUPABASE_ANON_KEY
 * @param {typeof fetch} options.fetchImpl
 * @param {() => object | Promise<object>} options.readSeed    renvoie le seed parsé
 * @param {(message: string) => void} options.log              reçoit les avertissements
 * @returns {Promise<{ content: object, source: 'supabase' | 'seed' }>}
 */
export async function loadContent({ env, fetchImpl, readSeed, log }) {
  const fallback = async (reason) => {
    log(`contenu : ${reason}, repli sur le seed`)
    return { content: await readSeed(), source: 'seed' }
  }

  const baseUrl = (env?.SUPABASE_URL ?? '').trim().replace(/\/+$/, '')
  const anonKey = (env?.SUPABASE_ANON_KEY ?? '').trim()
  if (!baseUrl || !anonKey) return fallback('SUPABASE_URL ou SUPABASE_ANON_KEY absente')

  let response
  try {
    response = await fetchImpl(`${baseUrl}/rest/v1/published_content?select=id,payload&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError'
    const detail = timedOut ? `délai de ${TIMEOUT_MS / 1000} s dépassé` : (error?.message ?? String(error))
    return fallback(`Supabase injoignable (${detail})`)
  }

  if (!response.ok) return fallback(`Supabase a répondu HTTP ${response.status}`)

  let rows
  try {
    rows = await response.json()
  } catch (error) {
    return fallback(`réponse Supabase illisible (${error?.message ?? error})`)
  }

  const row = Array.isArray(rows) ? rows[0] : undefined
  if (!row) return fallback('aucun instantané publié')

  const content = { ...row.payload, version: row.id }
  const errors = validateContent(content)
  if (errors.length > 0) {
    const shown = errors.slice(0, MAX_ERRORS_LOGGED).join(' ; ')
    const more = errors.length > MAX_ERRORS_LOGGED ? ` (+${errors.length - MAX_ERRORS_LOGGED})` : ''
    return fallback(`instantané publié invalide : ${shown}${more}`)
  }

  return { content, source: 'supabase' }
}
