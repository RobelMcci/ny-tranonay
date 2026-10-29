// Accès aux données du tableau de bord (liste plate de petites fonctions asynchrones).
// Ne doit être importé que depuis `src/admin/**`.
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
