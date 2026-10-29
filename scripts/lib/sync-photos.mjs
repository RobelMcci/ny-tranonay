// Télécharge les photos téléversées dans le bucket Storage `photos` vers src/assets/cms/ pour que le build
// (vite-imagetools) les traite comme les autres. Ne lève jamais : une photo introuvable est retirée du contenu.
import { Buffer } from 'node:buffer'

const TIMEOUT_MS = 20000

/**
 * @param {{ photos: Array<object> }} content
 * @param {Object} options
 * @param {typeof fetch} options.fetchImpl
 * @param {Record<string, string | undefined>} options.env   SUPABASE_URL
 * @param {string} options.dir                               dossier de destination (déjà créé)
 * @param {(path: string, data: Buffer) => Promise<void>} options.writeFile
 * @param {(message: string) => void} [options.log]
 * @returns {Promise<object>} nouveau contenu (l'entrée n'est pas modifiée)
 */
export async function syncPhotos(content, { fetchImpl, env, dir, writeFile, log = console.warn }) {
  const baseUrl = (env?.SUPABASE_URL ?? '').trim().replace(/\/+$/, '')
  const directory = dir.replace(/\/+$/, '')

  const download = async (photo) => {
    if (!baseUrl) throw new Error('SUPABASE_URL absente')
    const response = await fetchImpl(`${baseUrl}/storage/v1/object/public/photos/${encodeURI(photo.storagePath)}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    await writeFile(`${directory}/${photo.key}.jpg`, Buffer.from(await response.arrayBuffer()))
  }

  const photos = []
  for (const photo of content.photos ?? []) {
    if (photo.file || !photo.storagePath) {
      photos.push(photo)
      continue
    }
    try {
      await download(photo)
      photos.push({ ...photo, file: `cms/${photo.key}` })
    } catch (error) {
      log(`photo « ${photo.key} » retirée : téléchargement impossible (${error?.message ?? error})`)
    }
  }
  return { ...content, photos }
}
