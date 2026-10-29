import { beforeEach, describe, expect, it, vi } from 'vitest'

// Faux client Supabase : chaque appel de table ou de stockage est enregistré dans `calls`, les réponses sont réglées par test.
const state = vi.hoisted(() => ({ calls: [], responses: {} }))

vi.mock('./supabase.js', () => {
  const record = (name) => (...args) => {
    state.calls.push({ name, args })
    const response = state.responses[name]
    return Promise.resolve(typeof response === 'function' ? response(...args) : (response ?? { data: [], error: null }))
  }
  const chain = (table) => {
    const builder = {}
    for (const method of ['select', 'order', 'eq']) {
      builder[method] = (...args) => {
        state.calls.push({ name: `${table}.${method}`, args })
        return builder
      }
    }
    for (const method of ['insert', 'update', 'upsert', 'delete']) {
      builder[method] = (...args) => {
        state.calls.push({ name: `${table}.${method}`, args })
        return builder
      }
    }
    builder.then = (resolve, reject) => {
      const response = state.responses[table] ?? { data: [], error: null }
      return Promise.resolve(typeof response === 'function' ? response(state.calls) : response).then(resolve, reject)
    }
    return builder
  }
  return {
    getSupabase: () => ({
      from: chain,
      storage: { from: () => ({ upload: record('storage.upload'), remove: record('storage.remove') }) },
    }),
  }
})

const api = await import('./api.js')

const names = () => state.calls.map((call) => call.name)
const row = { key: 'piscine-2', file: null, storage_path: 'x.jpg', alt: 'La piscine', category: 'Piscine', width: 10, height: 5, gallery_position: null, visible: true }

beforeEach(() => {
  state.calls = []
  state.responses = {}
  vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:54321')
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000000')
})

describe('photoPublicUrl', () => {
  it('construit l’adresse publique du bucket', () => {
    expect(api.photoPublicUrl('abc.jpg')).toBe('http://127.0.0.1:54321/storage/v1/object/public/photos/abc.jpg')
    expect(api.photoPublicUrl('a b/é.jpg')).toBe('http://127.0.0.1:54321/storage/v1/object/public/photos/a%20b/%C3%A9.jpg')
  })
})

describe('loadPhotos / loadPhotoSlots', () => {
  it('convertit les lignes en photos', async () => {
    state.responses.photos = { data: [row], error: null }
    const photos = await api.loadPhotos()
    expect(photos).toEqual([{ key: 'piscine-2', file: null, storagePath: 'x.jpg', alt: 'La piscine', category: 'Piscine', width: 10, height: 5, galleryPosition: null, visible: true }])
    expect(names()).toEqual(['photos.select', 'photos.order', 'photos.order'])
  })

  it('renvoie les surcharges sous forme d’objet', async () => {
    state.responses.photo_slots = { data: [{ slot_key: 'hero.1', photo_key: 'piscine' }], error: null }
    await expect(api.loadPhotoSlots()).resolves.toEqual({ 'hero.1': 'piscine' })
  })

  it('traduit les erreurs en français', async () => {
    state.responses.photos = { data: null, error: { message: 'Failed to fetch' } }
    await expect(api.loadPhotos()).rejects.toThrow('Impossible de charger les photos. Connexion impossible. Vérifiez votre connexion internet puis réessayez.')
  })
})

describe('setPhotoSlot / clearPhotoSlot', () => {
  it('écrit la surcharge par upsert sur slot_key', async () => {
    await api.setPhotoSlot('hero.1', 'piscine')
    expect(state.calls[0]).toEqual({ name: 'photo_slots.upsert', args: [{ slot_key: 'hero.1', photo_key: 'piscine' }, { onConflict: 'slot_key' }] })
  })

  it('explique le refus quand la photo n’existe plus', async () => {
    state.responses.photo_slots = { data: null, error: { code: '23503', message: 'violates foreign key' } }
    await expect(api.setPhotoSlot('hero.1', 'zzz')).rejects.toThrow(/n’existe plus/)
  })

  it('supprime la surcharge, sans erreur si elle n’existait pas', async () => {
    await expect(api.clearPhotoSlot('hero.1')).resolves.toBeUndefined()
    expect(names()).toEqual(['photo_slots.delete', 'photo_slots.eq'])
  })
})

describe('savePhotoMeta', () => {
  it('met à jour par clé et renvoie la photo enregistrée', async () => {
    state.responses.photos = { data: [{ ...row, alt: 'Nouveau', gallery_position: 3 }], error: null }
    const saved = await api.savePhotoMeta('piscine-2', { alt: 'Nouveau', category: 'Piscine', galleryPosition: 3, visible: true })
    expect(saved).toMatchObject({ alt: 'Nouveau', galleryPosition: 3 })
    expect(state.calls[0].args[0]).toEqual({ alt: 'Nouveau', category: 'Piscine', gallery_position: 3, visible: true })
  })

  it('détecte une photo introuvable (0 ligne)', async () => {
    state.responses.photos = { data: [], error: null }
    await expect(api.savePhotoMeta('x', { alt: 'a', category: 'b', galleryPosition: null, visible: true })).rejects.toThrow(/introuvable/)
  })
})

describe('uploadPhoto', () => {
  const input = { blob: { size: 5 }, width: 10, height: 5, alt: 'La piscine', category: 'Piscine', existingKeys: ['piscine'] }

  it('envoie l’objet puis crée la ligne', async () => {
    state.responses.photos = { data: [row], error: null }
    const photo = await api.uploadPhoto(input)
    expect(names().filter((name) => name.startsWith('storage') || name === 'photos.insert')).toEqual(['storage.upload', 'photos.insert'])
    expect(state.calls[0].args).toEqual(['00000000-0000-4000-8000-000000000000.jpg', input.blob, { contentType: 'image/jpeg', upsert: false }])
    expect(state.calls[1].args[0]).toEqual({
      key: 'la-piscine',
      file: null,
      storage_path: '00000000-0000-4000-8000-000000000000.jpg',
      alt: 'La piscine',
      category: 'Piscine',
      width: 10,
      height: 5,
      gallery_position: null,
      visible: true,
    })
    expect(photo.key).toBe('piscine-2')
  })

  it('n’insère rien quand l’envoi échoue', async () => {
    state.responses['storage.upload'] = { data: null, error: { message: 'boom' } }
    await expect(api.uploadPhoto(input)).rejects.toThrow('Impossible d’envoyer la photo.')
    expect(names()).toEqual(['storage.upload'])
  })

  it('explique un fichier trop gros côté serveur', async () => {
    state.responses['storage.upload'] = { data: null, error: { message: 'The object exceeded the maximum allowed size', statusCode: '413' } }
    await expect(api.uploadPhoto(input)).rejects.toThrow(/2 Mo/)
  })

  it('retire l’objet envoyé quand la ligne ne peut pas être créée', async () => {
    state.responses.photos = { data: null, error: { code: '42501', message: 'new row violates row-level security policy' } }
    await expect(api.uploadPhoto(input)).rejects.toThrow('Impossible d’envoyer la photo. Vous n’avez pas les droits nécessaires.')
    expect(names().filter((name) => name.startsWith('storage'))).toEqual(['storage.upload', 'storage.remove'])
    expect(state.calls.find((call) => call.name === 'storage.remove').args[0]).toEqual(['00000000-0000-4000-8000-000000000000.jpg'])
  })

  it('renvoie l’erreur d’origine même si le nettoyage échoue', async () => {
    state.responses.photos = { data: null, error: { code: '23505', message: 'duplicate key' } }
    state.responses['storage.remove'] = () => {
      throw new Error('réseau coupé')
    }
    await expect(api.uploadPhoto(input)).rejects.toThrow(/identifiant/)
  })
})

describe('deletePhoto', () => {
  const photo = { key: 'x', storagePath: 'x.jpg' }

  it('supprime la ligne mais garde le fichier du Storage (des versions publiées peuvent encore y renvoyer)', async () => {
    state.responses.photos = { data: [{ key: 'x' }], error: null }
    await expect(api.deletePhoto(photo)).resolves.toEqual({ warning: null })
    expect(names()).toContain('photos.delete')
    expect(names().some((name) => name.startsWith('storage'))).toBe(false)
  })

  it('ne touche pas au bucket pour une photo du site', async () => {
    state.responses.photos = { data: [{ key: 'x' }], error: null }
    await expect(api.deletePhoto({ key: 'x', storagePath: null })).resolves.toEqual({ warning: null })
    expect(names().some((name) => name.startsWith('storage'))).toBe(false)
  })

  it('refuse une photo encore utilisée sans toucher au fichier', async () => {
    state.responses.photos = { data: null, error: { code: '23503', message: 'update or delete violates foreign key constraint' } }
    await expect(api.deletePhoto(photo)).rejects.toThrow('Cette photo est encore utilisée (emplacement ou chambre).')
    expect(names().some((name) => name.startsWith('storage'))).toBe(false)
  })

  it('détecte une photo introuvable (0 ligne) sans toucher au fichier', async () => {
    state.responses.photos = { data: [], error: null }
    await expect(api.deletePhoto(photo)).rejects.toThrow(/introuvable/)
    expect(names().some((name) => name.startsWith('storage'))).toBe(false)
  })


})
