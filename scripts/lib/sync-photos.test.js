import { Buffer } from 'node:buffer'
import { describe, expect, it, vi } from 'vitest'
import { syncPhotos } from './sync-photos.mjs'

const photo = (key, extra = {}) => ({
  key, file: null, storagePath: `uploads/${key}.jpg`, alt: key, category: 'Espace', width: 100, height: 80, galleryPosition: null, ...extra,
})
const seedPhoto = { key: 'piscine', file: 'image10', storagePath: null, alt: 'Piscine', category: 'Piscine', width: 1, height: 1, galleryPosition: 0 }
const env = { SUPABASE_URL: 'https://demo.supabase.co/' }

const okResponse = (bytes) => ({ ok: true, status: 200, arrayBuffer: async () => new Uint8Array(bytes).buffer })

describe('syncPhotos', () => {
  it('télécharge la photo, écrit le fichier et renvoie file = cms/<clé> sans muter l’entrée', async () => {
    const content = { photos: [photo('salle1'), seedPhoto] }
    const snapshot = structuredClone(content)
    const fetchImpl = vi.fn(async () => okResponse([1, 2, 3]))
    const writeFile = vi.fn(async () => {})
    const log = vi.fn()

    const result = await syncPhotos(content, { fetchImpl, env, dir: '/out/cms', writeFile, log })

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(fetchImpl.mock.calls[0][0]).toBe('https://demo.supabase.co/storage/v1/object/public/photos/uploads/salle1.jpg')
    expect(writeFile).toHaveBeenCalledWith('/out/cms/salle1.jpg', Buffer.from([1, 2, 3]))
    expect(result.photos.find((p) => p.key === 'salle1').file).toBe('cms/salle1')
    expect(result.photos.find((p) => p.key === 'piscine')).toEqual(seedPhoto)
    expect(content).toEqual(snapshot)
    expect(log).not.toHaveBeenCalled()
  })

  it('encode le chemin de stockage', async () => {
    const fetchImpl = vi.fn(async () => okResponse([1]))
    await syncPhotos({ photos: [photo('a', { storagePath: 'dossier x/é.jpg' })] }, { fetchImpl, env, dir: '/d', writeFile: async () => {}, log: () => {} })
    expect(fetchImpl.mock.calls[0][0]).toBe('https://demo.supabase.co/storage/v1/object/public/photos/dossier%20x/%C3%A9.jpg')
  })

  it('retire la photo et avertit une fois sur HTTP 404, sans exception', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 404 }))
    const writeFile = vi.fn()
    const log = vi.fn()
    const result = await syncPhotos({ photos: [photo('perdue'), seedPhoto] }, { fetchImpl, env, dir: '/d', writeFile, log })
    expect(result.photos.map((p) => p.key)).toEqual(['piscine'])
    expect(log).toHaveBeenCalledTimes(1)
    expect(log.mock.calls[0][0]).toContain('perdue')
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('retire la photo sur erreur réseau', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('réseau coupé') })
    const log = vi.fn()
    const result = await syncPhotos({ photos: [photo('x')] }, { fetchImpl, env, dir: '/d', writeFile: vi.fn(), log })
    expect(result.photos).toEqual([])
    expect(log).toHaveBeenCalledTimes(1)
  })

  it('retire la photo si l’écriture du fichier échoue', async () => {
    const writeFile = vi.fn(async () => { throw new Error('disque plein') })
    const log = vi.fn()
    const result = await syncPhotos({ photos: [photo('x')] }, { fetchImpl: async () => okResponse([1]), env, dir: '/d', writeFile, log })
    expect(result.photos).toEqual([])
    expect(log).toHaveBeenCalledTimes(1)
  })

  it('sans SUPABASE_URL : aucun appel réseau, photos du Storage retirées avec avertissement', async () => {
    const fetchImpl = vi.fn()
    const log = vi.fn()
    const result = await syncPhotos({ photos: [photo('a'), photo('b'), seedPhoto] }, { fetchImpl, env: {}, dir: '/d', writeFile: vi.fn(), log })
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(result.photos).toEqual([seedPhoto])
    expect(log).toHaveBeenCalled()
  })

  it('laisse intacte une photo qui a déjà un fichier, même avec un storagePath', async () => {
    const fetchImpl = vi.fn()
    const kept = photo('deja', { file: 'cms/deja' })
    const result = await syncPhotos({ photos: [kept] }, { fetchImpl, env, dir: '/d', writeFile: vi.fn(), log: vi.fn() })
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(result.photos).toEqual([kept])
  })

  it('ne fait rien pour un contenu sans photo du Storage (seed)', async () => {
    const content = { photos: [seedPhoto], texts: {} }
    const fetchImpl = vi.fn()
    const log = vi.fn()
    const result = await syncPhotos(content, { fetchImpl, env: {}, dir: '/d', writeFile: vi.fn(), log })
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
    expect(result).toEqual(content)
  })
})
