// Accès aux données du tableau de bord (liste plate de petites fonctions asynchrones).
// Ne doit être importé que depuis `src/admin/**`.
import { faqFromRow } from './faqs-map.js'
import { pageFromRow, pageToRow } from './pages-map.js'
import { roomFromRow, roomToRow } from './rooms-map.js'
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

/**
 * Erreur entièrement en français : l'action échouée, puis une cause compréhensible quand on la connaît
 * (droits, connexion, doublon). Jamais de texte anglais brut de Supabase.
 */
export function failureFr(action, error) {
  const message = String(error?.message ?? '')
  let cause = ''
  if (error?.code === '42501' || error?.status === 401 || error?.status === 403 || /row-level security|permission denied|not authorized/i.test(message)) {
    cause = 'Vous n’avez pas les droits nécessaires.'
  } else if (/failed to fetch|networkerror|network request failed|load failed/i.test(message)) {
    cause = 'Connexion impossible. Vérifiez votre connexion internet puis réessayez.'
  } else if (error?.code === '23505') {
    cause = 'Cet identifiant existe déjà : modifiez le nom.'
  }
  return new Error(cause ? `${action} ${cause}` : action)
}

/**
 * Toutes les chambres du brouillon, visibles ou non, dans l'ordre d'affichage.
 * @returns {Promise<import('./rooms-map.js').Room[]>}
 */
export async function loadRooms() {
  const { data, error } = await getSupabase().from('rooms').select('*').order('position').order('id')
  if (error) throw failureFr('Impossible de charger les chambres.', error)
  return (data ?? []).map(roomFromRow)
}

/**
 * Crée une chambre (`isNew`) ou met à jour une chambre existante.
 * Création : `insert`, refusée si l'identifiant existe déjà (jamais d'écrasement silencieux).
 * Modification : `update` sur l'identifiant, sans toucher à `position` (l'ordre n'est changé que par `saveRoomOrder`).
 * @param {import('./rooms-map.js').Room} room
 * @param {{ isNew?: boolean }} [options]
 */
export async function saveRoom(room, { isNew = false } = {}) {
  const action = `Impossible d’enregistrer la chambre « ${room.name} ».`
  const table = getSupabase().from('rooms')
  const row = roomToRow(room)
  if (isNew) {
    const { error } = await table.insert(row)
    if (error) throw failureFr(action, error)
    return
  }
  const { id, position, ...changes } = row
  void position
  const { data, error } = await table.update(changes).eq('id', id).select('id')
  if (error) throw failureFr(action, error)
  if (!data?.length) throw new Error(`${action} Chambre introuvable ou vous n’avez pas les droits nécessaires.`)
}

/**
 * Enregistre l'ordre des chambres en UNE requête (upsert de lignes complètes) : tout est enregistré ou rien.
 * Les chambres reçues sont les versions enregistrées, avec leur nouvelle `position`.
 * @param {import('./rooms-map.js').Room[]} rooms
 */
export async function saveRoomOrder(rooms) {
  if (rooms.length === 0) return
  const { error } = await getSupabase().from('rooms').upsert(rooms.map(roomToRow), { onConflict: 'id' })
  if (error) throw failureFr('Impossible d’enregistrer l’ordre des chambres.', error)
}

/**
 * Photos proposées pour une chambre (registre complet, y compris les photos masquées).
 * @returns {Promise<{ key: string, alt: string, category: string, visible: boolean }[]>}
 */
export async function loadPhotoChoices() {
  const { data, error } = await getSupabase().from('photos').select('key, alt, category, visible').order('category').order('key')
  if (error) throw failureFr('Impossible de charger les photos.', error)
  return data ?? []
}

/**
 * @typedef {object} ListItemRow
 * @property {number} id
 * @property {string} list_key
 * @property {string} label
 * @property {number} position
 * @property {boolean} visible
 */

/**
 * Tous les éléments de listes, visibles ou non, groupés par liste puis triés par position.
 * @returns {Promise<ListItemRow[]>}
 */
export async function loadListItems() {
  const { data, error } = await getSupabase().from('list_items').select('id, list_key, label, position, visible').order('list_key').order('position').order('id')
  if (error) throw failureFr('Impossible de charger les listes.', error)
  return data ?? []
}

/**
 * Ajoute un élément (sans `id`) ou met à jour le libellé, la position et la visibilité d'un élément existant.
 * @param {{ id?: number, list_key: string, label: string, position: number, visible: boolean }} item
 * @returns {Promise<ListItemRow>} La ligne enregistrée.
 */
export async function saveListItem(item) {
  const table = getSupabase().from('list_items')
  const action = `Impossible d’enregistrer l’élément « ${item.label} ».`
  const { data, error } =
    item.id == null
      ? await table.insert({ list_key: item.list_key, label: item.label, position: item.position, visible: item.visible }).select('id, list_key, label, position, visible')
      : await table.update({ label: item.label, position: item.position, visible: item.visible }).eq('id', item.id).select('id, list_key, label, position, visible')
  if (error) throw failureFr(action, error)
  if (!data?.length) throw new Error(`${action} Élément introuvable ou vous n’avez pas les droits nécessaires.`)
  return data[0]
}

/** @param {number} id */
export async function deleteListItem(id) {
  const { data, error } = await getSupabase().from('list_items').delete().eq('id', id).select('id')
  if (error) throw failureFr('Impossible de supprimer l’élément.', error)
  if (!data?.length) throw new Error('Impossible de supprimer l’élément : il est introuvable ou vous n’avez pas les droits nécessaires.')
}

/**
 * Enregistre l'ordre d'une liste en UNE instruction SQL (fonction `reorder_list_items`) : tout ou rien.
 * La position de chaque identifiant devient son indice.
 * @param {number[]} ids
 */
export async function saveListOrder(ids) {
  if (ids.length === 0) return
  const { error } = await getSupabase().rpc('reorder_list_items', { ids })
  if (error?.code === 'P0002') {
    throw new Error('Impossible d’enregistrer l’ordre de la liste : un élément est introuvable ou vous n’avez pas les droits nécessaires.')
  }
  if (error) throw failureFr('Impossible d’enregistrer l’ordre de la liste.', error)
}

const FAQ_COLUMNS = 'id, question, answer, position, visible'

/**
 * Toutes les questions de la FAQ du brouillon, visibles ou non, dans l'ordre d'affichage.
 * @returns {Promise<import('./faqs-map.js').Faq[]>}
 */
export async function loadFaqs() {
  const { data, error } = await getSupabase().from('faqs').select(FAQ_COLUMNS).order('position').order('id')
  if (error) throw failureFr('Impossible de charger la FAQ.', error)
  return (data ?? []).map(faqFromRow)
}

/**
 * Ajoute une question (sans `id`) ou met à jour une question existante.
 * La mise à jour ne touche jamais à `position` : l'ordre n'est changé que par `saveFaqOrder`.
 * @param {import('./faqs-map.js').Faq} faq
 * @returns {Promise<import('./faqs-map.js').Faq>} La question enregistrée.
 */
export async function saveFaq(faq) {
  const table = getSupabase().from('faqs')
  const action = `Impossible d’enregistrer la question « ${faq.question} ».`
  const { data, error } =
    faq.id == null
      ? await table.insert({ question: faq.question, answer: faq.answer, position: faq.position, visible: faq.visible }).select(FAQ_COLUMNS)
      : await table.update({ question: faq.question, answer: faq.answer, visible: faq.visible }).eq('id', faq.id).select(FAQ_COLUMNS)
  if (error) throw failureFr(action, error)
  if (!data?.length) throw new Error(`${action} Question introuvable ou vous n’avez pas les droits nécessaires.`)
  return faqFromRow(data[0])
}

/** @param {number} id */
export async function deleteFaq(id) {
  const { data, error } = await getSupabase().from('faqs').delete().eq('id', id).select('id')
  if (error) throw failureFr('Impossible de supprimer la question.', error)
  if (!data?.length) throw new Error('Impossible de supprimer la question : elle est introuvable ou vous n’avez pas les droits nécessaires.')
}

/**
 * Enregistre l'ordre de la FAQ en UNE instruction SQL (fonction `reorder_faqs`) : tout ou rien.
 * La position de chaque identifiant devient son indice.
 * @param {number[]} ids
 */
export async function saveFaqOrder(ids) {
  if (ids.length === 0) return
  const { error } = await getSupabase().rpc('reorder_faqs', { ids })
  if (error?.code === 'P0002') {
    throw new Error('Impossible d’enregistrer l’ordre de la FAQ : une question est introuvable ou vous n’avez pas les droits nécessaires.')
  }
  if (error) throw failureFr('Impossible d’enregistrer l’ordre de la FAQ.', error)
}

/**
 * Référencement de toutes les pages, de la plus prioritaire à la moins prioritaire.
 * @returns {Promise<import('./pages-map.js').PageSeo[]>}
 */
export async function loadPagesSeo() {
  const { data, error } = await getSupabase().from('pages_seo').select('path, title, description, priority, nav_label').order('priority', { ascending: false }).order('path')
  if (error) throw failureFr('Impossible de charger le référencement.', error)
  return (data ?? []).map(pageFromRow)
}

/**
 * Met à jour une page existante (le chemin identifie la page). Ne crée ni ne supprime jamais de page :
 * l'ensemble des pages est fixé par le code du site.
 * @param {import('./pages-map.js').PageSeo} page
 * @returns {Promise<import('./pages-map.js').PageSeo>} La page enregistrée.
 */
export async function savePageSeo(page) {
  const action = `Impossible d’enregistrer le référencement de la page « ${page.path} ».`
  const { path, ...changes } = pageToRow(page)
  const { data, error } = await getSupabase().from('pages_seo').update(changes).eq('path', path).select('path, title, description, priority, nav_label')
  if (error) throw failureFr(action, error)
  if (!data?.length) throw new Error(`${action} Page introuvable ou vous n’avez pas les droits nécessaires.`)
  return pageFromRow(data[0])
}
