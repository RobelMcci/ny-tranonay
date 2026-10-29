// Accès aux données du tableau de bord (liste plate de petites fonctions asynchrones).
// Ne doit être importé que depuis `src/admin/**`.
import { faqFromRow } from './faqs-map.js'
import { newPhotoKey } from './image.js'
import { pageFromRow, pageToRow } from './pages-map.js'
import { photoFromRow } from './photos-map.js'
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

/**
 * Surcharges de textes du brouillon (les textes sans ligne gardent leur défaut du code).
 * @returns {Promise<Record<string, string>>} clé d'emplacement → texte
 */
export async function loadTexts() {
  const { data, error } = await getSupabase().from('texts').select('key, value')
  if (error) throw failureFr('Impossible de charger les textes.', error)
  return Object.fromEntries((data ?? []).map((row) => [row.key, row.value]))
}

/**
 * Enregistre les surcharges en deux requêtes : un seul upsert, puis une seule suppression (retour au défaut).
 * Si l'upsert échoue, rien n'est supprimé ; si la suppression échoue après un upsert réussi, le message le dit.
 * @param {{ upserts: { key: string, value: string }[], deletes: string[] }} changes
 */
export async function saveTexts({ upserts, deletes }) {
  if (upserts.length > 0) {
    const { error } = await getSupabase().from('texts').upsert(upserts, { onConflict: 'key' })
    if (error) throw failureFr('Impossible d’enregistrer les textes.', error)
  }
  if (deletes.length > 0) {
    const { error } = await getSupabase().from('texts').delete().in('key', deletes)
    if (error) {
      if (upserts.length > 0) throw new Error('Les textes modifiés sont enregistrés, mais le retour au texte d’origine a échoué : réessayez.')
      throw failureFr('Impossible de rétablir le texte d’origine.', error)
    }
  }
}

const PHOTO_BUCKET = 'photos'

/**
 * Adresse publique d'un objet du bucket `photos` (même forme que celle utilisée par le build).
 * @param {string} storagePath
 */
export function photoPublicUrl(storagePath) {
  return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${encodeURI(storagePath)}`
}

/**
 * Toutes les photos, visibles ou non, par catégorie puis par clé.
 * @returns {Promise<import('./photos-map.js').Photo[]>}
 */
export async function loadPhotos() {
  const { data, error } = await getSupabase().from('photos').select('*').order('category').order('key')
  if (error) throw failureFr('Impossible de charger les photos.', error)
  return (data ?? []).map(photoFromRow)
}

/**
 * Surcharges d'emplacements du brouillon.
 * @returns {Promise<Record<string, string>>} emplacement → clé de photo
 */
export async function loadPhotoSlots() {
  const { data, error } = await getSupabase().from('photo_slots').select('slot_key, photo_key')
  if (error) throw failureFr('Impossible de charger les emplacements.', error)
  return Object.fromEntries((data ?? []).map((row) => [row.slot_key, row.photo_key]))
}

/**
 * Choisit la photo d'un emplacement (crée ou remplace la surcharge).
 * @param {string} slotKey
 * @param {string} photoKey
 */
export async function setPhotoSlot(slotKey, photoKey) {
  const action = 'Impossible de changer la photo de cet emplacement.'
  const { error } = await getSupabase().from('photo_slots').upsert({ slot_key: slotKey, photo_key: photoKey }, { onConflict: 'slot_key' })
  if (error?.code === '23503') throw new Error(`${action} Cette photo n’existe plus : rechargez la page.`)
  if (error) throw failureFr(action, error)
}

/**
 * Rétablit la photo par défaut d'un emplacement (supprime la surcharge ; rien à faire s'il n'y en a pas).
 * @param {string} slotKey
 */
export async function clearPhotoSlot(slotKey) {
  const { error } = await getSupabase().from('photo_slots').delete().eq('slot_key', slotKey)
  if (error) throw failureFr('Impossible de rétablir la photo par défaut.', error)
}

/**
 * Met à jour le texte alternatif, la catégorie, le rang de galerie et la visibilité d'une photo.
 * @param {string} key
 * @param {{ alt: string, category: string, galleryPosition: number | null, visible: boolean }} meta
 * @returns {Promise<import('./photos-map.js').Photo>} La photo enregistrée.
 */
export async function savePhotoMeta(key, { alt, category, galleryPosition, visible }) {
  const action = 'Impossible d’enregistrer la photo.'
  const { data, error } = await getSupabase()
    .from('photos')
    .update({ alt, category, gallery_position: galleryPosition, visible })
    .eq('key', key)
    .select('*')
  if (error) throw failureFr(action, error)
  if (!data?.length) throw new Error(`${action} Photo introuvable ou vous n’avez pas les droits nécessaires.`)
  return photoFromRow(data[0])
}

/**
 * Envoie une photo déjà redimensionnée dans le bucket (`<uuid>.jpg`), puis crée sa ligne `photos`
 * (`file` nul, hors galerie, visible). Si la ligne n'a pas pu être créée, l'objet envoyé est retiré (au mieux).
 * @param {{ blob: Blob, width: number, height: number, alt: string, category: string, existingKeys: string[] }} input
 * @returns {Promise<import('./photos-map.js').Photo>}
 */
export async function uploadPhoto({ blob, width, height, alt, category, existingKeys }) {
  const supabase = getSupabase()
  const action = 'Impossible d’envoyer la photo.'
  const storagePath = `${crypto.randomUUID()}.jpg`
  const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(storagePath, blob, { contentType: 'image/jpeg', upsert: false })
  if (uploadError) {
    if (String(uploadError.statusCode ?? uploadError.status) === '413') throw new Error(`${action} Le fichier dépasse 2 Mo.`)
    throw failureFr(action, uploadError)
  }
  const row = {
    key: newPhotoKey(alt, existingKeys),
    file: null,
    storage_path: storagePath,
    alt,
    category,
    width,
    height,
    gallery_position: null,
    visible: true,
  }
  const { data, error } = await supabase.from('photos').insert(row).select('*')
  if (error || !data?.length) {
    try {
      await supabase.storage.from(PHOTO_BUCKET).remove([storagePath])
    } catch {
      // Nettoyage au mieux : l'erreur d'origine prime.
    }
    if (error?.code === '23505') throw new Error(`${action} Une photo porte déjà cet identifiant : modifiez légèrement le texte alternatif.`)
    if (error) throw failureFr(action, error)
    throw new Error(`${action} Vous n’avez pas les droits nécessaires.`)
  }
  return photoFromRow(data[0])
}

/**
 * Supprime une photo : la ligne d'abord (refusée si un emplacement ou une chambre l'utilise), puis le fichier du bucket.
 * Un fichier qui ne peut pas être retiré n'est pas une erreur : la photo est bien supprimée, un avertissement est renvoyé.
 * @param {{ key: string, storagePath: string | null }} photo
 * @returns {Promise<{ warning: string | null }>}
 */
export async function deletePhoto(photo) {
  const supabase = getSupabase()
  const action = 'Impossible de supprimer la photo.'
  const { data, error } = await supabase.from('photos').delete().eq('key', photo.key).select('key')
  if (error?.code === '23503') throw new Error('Cette photo est encore utilisée (emplacement ou chambre).')
  if (error) throw failureFr(action, error)
  if (!data?.length) throw new Error(`${action} Photo introuvable ou vous n’avez pas les droits nécessaires.`)
  if (!photo.storagePath) return { warning: null }
  try {
    const { error: removeError } = await supabase.storage.from(PHOTO_BUCKET).remove([photo.storagePath])
    if (removeError) throw removeError
  } catch {
    return { warning: 'La photo est supprimée, mais son fichier n’a pas pu être retiré du stockage. Il n’est plus visible nulle part.' }
  }
  return { warning: null }
}
