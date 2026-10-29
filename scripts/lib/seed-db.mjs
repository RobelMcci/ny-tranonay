// Import du contenu actuel du site (seed) dans la base Supabase, puis premier instantané « Import initial ».
// Passe par PostgREST avec la clé service_role (qui contourne la RLS) : à lancer depuis un poste de confiance seulement.
import { validateContent } from '../../src/data/content-schema.js'
import { seedRows } from './seed-rows.mjs'

const TIMEOUT_MS = 30000

/** Tables de contenu : les seules dont la présence de lignes bloque l'import sans `--force`. */
export const CONTENT_TABLES = [
  'settings', 'prices', 'rooms', 'list_items', 'faqs', 'pages_seo', 'photos', 'photo_slots', 'texts', 'content_snapshots',
]

/** Tables vidées par `--force` (ordre : `photo_slots` avant `photos`, `rooms` avant `photos`). `content_snapshots` n'y est jamais. */
export const REPLACED_TABLES = [
  ['photo_slots', 'slot_key'],
  ['texts', 'key'],
  ['list_items', 'id'],
  ['faqs', 'id'],
  ['rooms', 'id'],
  ['pages_seo', 'path'],
  ['photos', 'key'],
  ['prices', 'key'],
  ['settings', 'id'],
]

/** Ordre d'insertion ; `conflict` = clé d'upsert, absent = insertion simple (colonne `id` générée). */
const INSERT_PLAN = [
  { table: 'settings', conflict: 'id' },
  { table: 'prices', conflict: 'key' },
  { table: 'photos', conflict: 'key' },
  { table: 'rooms', conflict: 'id' },
  { table: 'pages_seo', conflict: 'path' },
  { table: 'list_items' },
  { table: 'faqs' },
]

/** @returns {boolean} vrai si l'adresse désigne cette machine (localhost, 127.0.0.1, [::1]). */
export function isLocalUrl(value) {
  try {
    const host = new URL(value).hostname
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1'
  } catch {
    return false
  }
}

class SeedError extends Error {}

/**
 * @param {Object} options
 * @param {object} options.content                          seed parsé
 * @param {Record<string, string | undefined>} options.env  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * @param {string[]} options.argv                           options de la ligne de commande
 * @param {typeof fetch} options.fetchImpl
 * @param {(message: string) => void} options.log
 * @returns {Promise<number>} code de sortie (0 = importé, 1 = refus ou erreur)
 */
export async function runSeed({ content, env, argv, fetchImpl, log }) {
  const force = argv.includes('--force')
  const allowRemote = argv.includes('--i-know-this-is-not-local')
  const baseUrl = (env.SUPABASE_URL ?? '').trim().replace(/\/+$/, '')
  const key = (env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

  if (!baseUrl || !key) {
    log('Import impossible : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définies (variables d’environnement ou fichier .env.local).')
    return 1
  }
  if (!isLocalUrl(baseUrl) && !allowRemote) {
    log(
      `Import refusé : ${new URL(baseUrl).host} n’est pas une base locale. ` +
        'Pour importer volontairement dans un projet Supabase en ligne, ajoutez --i-know-this-is-not-local.',
    )
    return 1
  }

  const errors = validateContent(content)
  if (errors.length > 0) {
    log(`Import impossible : le seed est invalide (${errors.slice(0, 3).join(' ; ')}).`)
    return 1
  }
  const rows = seedRows(content)

  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  const call = async (path, init = {}) => {
    let response
    try {
      response = await fetchImpl(`${baseUrl}/rest/v1/${path}`, {
        ...init,
        headers: { ...headers, ...init.headers },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch (error) {
      throw new SeedError(`base injoignable (${error?.message ?? error})`)
    }
    if (!response.ok) {
      let detail = ''
      try {
        const body = await response.json()
        detail = [body?.code, body?.message].filter(Boolean).join(' ')
      } catch {
        // corps illisible : on garde le seul code HTTP
      }
      throw new SeedError(`${path.split('?')[0]} : HTTP ${response.status}${detail ? ` (${detail})` : ''}`)
    }
    return response
  }

  const countRows = async (table) => {
    const response = await call(`${table}?select=*&limit=1`, { headers: { Prefer: 'count=exact' } })
    const total = Number((response.headers.get('content-range') ?? '').split('/')[1])
    if (!Number.isInteger(total)) throw new SeedError(`${table} : décompte illisible`)
    return total
  }

  try {
    if (!force) {
      const filled = []
      for (const table of CONTENT_TABLES) {
        const total = await countRows(table)
        if (total > 0) filled.push(`${table} (${total})`)
      }
      if (filled.length > 0) {
        log(`Import refusé : la base contient déjà du contenu : ${filled.join(', ')}.`)
        log('Rien n’a été modifié. Pour écraser les tables du site avec le contenu d’origine, relancez avec --force (les instantanés publiés sont conservés).')
        return 1
      }
    } else {
      for (const [table, column] of REPLACED_TABLES) {
        await call(`${table}?${column}=not.is.null`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } })
      }
      log(`Mode --force : contenu existant supprimé (${REPLACED_TABLES.map(([table]) => table).join(', ')}). Les instantanés et les fichiers du Storage sont conservés.`)
    }

    const summary = []
    for (const { table, conflict } of INSERT_PLAN) {
      const body = rows[table]
      if (body.length === 0) continue
      const path = conflict ? `${table}?on_conflict=${conflict}` : table
      const prefer = conflict ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal'
      await call(path, { method: 'POST', body: JSON.stringify(body), headers: { Prefer: prefer } })
      summary.push(`${table} : ${body.length}`)
    }

    // `publish_content` exige un administrateur connecté : on écrit directement le premier instantané.
    await call('content_snapshots', {
      method: 'POST',
      body: JSON.stringify([{ label: 'Import initial', payload: { ...content, version: null }, created_by: null }]),
      headers: { Prefer: 'return=minimal' },
    })

    log(`Import terminé (${summary.join(', ')}).`)
    log('Premier instantané « Import initial » publié : le prochain build du site utilisera ce contenu.')
    return 0
  } catch (error) {
    if (!(error instanceof SeedError)) throw error
    log(`Import interrompu : ${error.message}.`)
    log(force ? 'Des tables ont pu être vidées sans être remplies : relancez la même commande avec --force.' : 'Corrigez le problème puis relancez la commande.')
    return 1
  }
}
