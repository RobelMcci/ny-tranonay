// Accès aux données du tableau de bord (liste plate de petites fonctions asynchrones).
// Ne doit être importé que depuis `src/admin/**`.
import { settingsFromRow, settingsToRow } from './settings-map.js'
import { getSupabase } from './supabase.js'

/** Message d'erreur en français ; jamais de clé ni d'URL, seulement le texte renvoyé par Supabase. */
function failure(action, error) {
  const detail = error?.message ? ` (${String(error.message)})` : ''
  return new Error(`${action}${detail}`)
}

/**
 * Brouillon courant : contenu construit depuis les tables modifiables (administrateurs seulement).
 * @returns {Promise<object>} Contenu au format « Content ».
 */
export async function fetchDraft() {
  const { data, error } = await getSupabase().rpc('draft_content')
  if (error) throw failure('Impossible de charger le brouillon.', error)
  if (!data || typeof data !== 'object') throw new Error('Impossible de charger le brouillon : réponse vide.')
  return data
}

/**
 * Dernière version publiée, ou `null` si rien n'a encore été publié.
 * @returns {Promise<{ id: string, created_at: string, label: string | null, payload: object } | null>}
 */
export async function fetchPublished() {
  const { data, error } = await getSupabase()
    .from('content_snapshots')
    .select('id, created_at, label, payload')
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) throw failure('Impossible de charger la version publiée.', error)
  return data?.[0] ?? null
}

/**
 * Informations générales (ligne unique de `settings`).
 * @returns {Promise<object | null>} Réglages au format `Content.settings`, ou `null` si la base est vide.
 */
export async function loadSettings() {
  const { data, error } = await getSupabase().from('settings').select('*').eq('id', 1).maybeSingle()
  if (error) throw failure('Impossible de charger les informations.', error)
  return settingsFromRow(data)
}

/**
 * Enregistre les informations dans le brouillon (rien n'est publié).
 * @param {object} settings Réglages au format `Content.settings`.
 */
export async function saveSettings(settings) {
  const { error } = await getSupabase().from('settings').upsert(settingsToRow(settings), { onConflict: 'id' })
  if (error) throw failure('Impossible d’enregistrer les informations.', error)
}

/**
 * Tarifs du brouillon.
 * @returns {Promise<{ key: string, label: string, amount: number, unit: 'ar' | 'personnes' }[]>}
 */
export async function loadPrices() {
  const { data, error } = await getSupabase().from('prices').select('key, label, amount, unit').order('key')
  if (error) throw failure('Impossible de charger les tarifs.', error)
  return data ?? []
}

/**
 * Met à jour le montant des tarifs indiqués (ne crée ni ne supprime de tarif).
 * S'arrête à la première erreur, en nommant le tarif concerné.
 * @param {{ key: string, amount: number, label?: string }[]} changes
 */
export async function savePrices(changes) {
  for (const { key, amount, label } of changes) {
    const { data, error } = await getSupabase().from('prices').update({ amount }).eq('key', key).select('key')
    if (error) throw failure(`Impossible d’enregistrer le tarif « ${label ?? key} ».`, error)
    if (!data?.length) throw new Error(`Impossible d’enregistrer le tarif « ${label ?? key} » : tarif introuvable.`)
  }
}
