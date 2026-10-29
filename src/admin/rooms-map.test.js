import { describe, expect, it } from 'vitest'
import seed from '../data/content.seed.json'
import { formFromRoom, isRoomDirty, parseFeatures, roomFromForm, roomFromRow, roomToRow, slugify, validateRoom } from './rooms-map.js'

const valid = () => ({ id: 'double', name: 'Chambre double', price: '45 000', features: 'Lit 2 places\nWifi', photoKeys: [], quantity: '1', position: 0, visible: true })

describe('roomFromRow / roomToRow', () => {
  it('fait l’aller-retour sur les chambres du seed (avec quantité, photos, position et visibilité)', () => {
    const rooms = seed.rooms.map((room, position) => ({ ...room, quantity: room.quantity + position, photoKeys: ['facade', 'facadeJour'], position, visible: position % 2 === 0 }))
    for (const room of rooms) expect(roomFromRow(roomToRow(room))).toEqual(room)
  })

  it('convertit les colonnes snake_case', () => {
    const room = roomFromRow({ id: 'twin', name: 'Twin', price_ar: 55000, features: ['TV'], photo_keys: ['a'], quantity: 2, position: 3, visible: false })
    expect(room).toEqual({ id: 'twin', name: 'Twin', price: 55000, features: ['TV'], photoKeys: ['a'], quantity: 2, position: 3, visible: false })
    expect(roomToRow(room)).toEqual({ id: 'twin', name: 'Twin', price_ar: 55000, features: ['TV'], photo_keys: ['a'], quantity: 2, position: 3, visible: false })
  })

  it('remplace les tableaux absents par des tableaux vides', () => {
    const room = roomFromRow({ id: 'x', name: 'X', price_ar: 1, features: null, photo_keys: null, quantity: 1, position: 0, visible: true })
    expect(room.features).toEqual([])
    expect(room.photoKeys).toEqual([])
  })
})

describe('slugify', () => {
  it('retire les accents et la ponctuation', () => {
    expect(slugify('Chambre double, toilette privée', [])).toBe('chambre-double-toilette-privee')
  })

  it('met en minuscules et regroupe les séparateurs', () => {
    expect(slugify('  Suite   NUIT -- 2!  ', [])).toBe('suite-nuit-2')
  })

  it('ajoute un suffixe en cas de collision', () => {
    expect(slugify('Chambre double', ['chambre-double'])).toBe('chambre-double-2')
    expect(slugify('Chambre double', ['chambre-double', 'chambre-double-2'])).toBe('chambre-double-3')
  })

  it('n’est jamais vide', () => {
    expect(slugify('', [])).toBe('chambre')
    expect(slugify('   ', [])).toBe('chambre')
    expect(slugify('€$%!', [])).toBe('chambre')
    expect(slugify('€$%!', ['chambre'])).toBe('chambre-2')
  })

  it('limite à 40 caractères sans tiret final', () => {
    const slug = slugify('Une chambre au nom vraiment très très long pour tester la limite', [])
    expect(slug.length).toBeLessThanOrEqual(40)
    expect(slug).not.toMatch(/-$/)
    expect(slug.startsWith('une-chambre-au-nom-vraiment')).toBe(true)
  })

  it('développe les ligatures et ignore les caractères non latins', () => {
    expect(slugify('Cœur', [])).toBe('coeur')
    expect(slugify('Æ Café 東京', [])).toBe('ae-cafe')
    expect(slugify('ŒUF ÆON', [])).toBe('oeuf-aeon')
  })

  it('reste à 40 caractères au plus, même avec un suffixe de collision', () => {
    const long = 'Une chambre au nom vraiment très très long pour tester la limite'
    const alone = slugify(long, [])
    expect(alone.length).toBeLessThanOrEqual(40)
    const collided = slugify(long, [alone])
    expect(collided.length).toBeLessThanOrEqual(40)
    expect(collided).not.toBe(alone)
    expect(collided.endsWith('-2')).toBe(true)
    expect(collided).not.toMatch(/--/)
  })

  it('gère des collisions répétées jusqu’à -10 en restant bornée et unique', () => {
    const long = 'x'.repeat(60)
    const taken = []
    for (let i = 0; i < 10; i += 1) {
      const slug = slugify(long, taken)
      expect(slug.length).toBeLessThanOrEqual(40)
      expect(taken).not.toContain(slug)
      taken.push(slug)
    }
    expect(taken[0]).toBe('x'.repeat(40))
    expect(taken[1]).toBe(`${'x'.repeat(38)}-2`)
    expect(taken[9]).toBe(`${'x'.repeat(37)}-10`)
  })

  it('retire le tiret laissé par la troncature avant le suffixe', () => {
    const base = `${'a'.repeat(37)}-bcd`
    expect(slugify(base, [base.slice(0, 40)])).toBe(`${'a'.repeat(37)}-2`)
  })
})

describe('parseFeatures', () => {
  it('découpe par ligne, nettoie et retire les lignes vides', () => {
    expect(parseFeatures('  Wifi \n\n\r\nClimatisation\r\n   \nTV')).toEqual(['Wifi', 'Climatisation', 'TV'])
  })

  it('accepte déjà un tableau', () => {
    expect(parseFeatures([' Wifi ', ''])).toEqual(['Wifi'])
  })
})

describe('validateRoom', () => {
  it('accepte une chambre valide', () => {
    expect(validateRoom(valid())).toEqual({})
  })

  it('refuse un nom vide ou trop long', () => {
    expect(validateRoom({ ...valid(), name: '   ' }).name).toMatch(/nom/i)
    expect(validateRoom({ ...valid(), name: 'x'.repeat(81) }).name).toMatch(/80/)
    expect(validateRoom({ ...valid(), name: 'x'.repeat(80) }).name).toBeUndefined()
  })

  it('refuse un prix négatif, décimal ou vide', () => {
    expect(validateRoom({ ...valid(), price: '-5' }).price).toMatch(/négatif/)
    expect(validateRoom({ ...valid(), price: '12,5' }).price).toMatch(/entier/)
    expect(validateRoom({ ...valid(), price: '' }).price).toBeTruthy()
  })

  it('refuse une quantité inférieure à 1 ou au-delà de 50', () => {
    expect(validateRoom({ ...valid(), quantity: '0' }).quantity).toBeTruthy()
    expect(validateRoom({ ...valid(), quantity: 51 }).quantity).toBeTruthy()
    expect(validateRoom({ ...valid(), quantity: 50 }).quantity).toBeUndefined()
  })

  it('refuse plus de 20 équipements', () => {
    const lines = (n) => Array.from({ length: n }, (_, i) => `Équipement ${i}`).join('\n')
    expect(validateRoom({ ...valid(), features: lines(21) }).features).toMatch(/20/)
    expect(validateRoom({ ...valid(), features: lines(20) }).features).toBeUndefined()
  })

  it('refuse un équipement de plus de 80 caractères', () => {
    expect(validateRoom({ ...valid(), features: `Wifi\n${'x'.repeat(81)}` }).features).toMatch(/80/)
  })

  it('signale plusieurs erreurs à la fois', () => {
    const errors = validateRoom({ ...valid(), name: '', price: 'abc', quantity: 0 })
    expect(Object.keys(errors).sort()).toEqual(['name', 'price', 'quantity'])
  })
})

describe('formFromRoom / roomFromForm', () => {
  it('fait l’aller-retour entre chambre et saisie', () => {
    const room = { id: 'a', name: 'A', price: 45000, features: ['Wifi', 'TV'], photoKeys: ['k'], quantity: 2, position: 1, visible: false }
    const form = formFromRoom(room)
    expect(form.features).toBe('Wifi\nTV')
    expect(form.price).toBe('45 000')
    expect(roomFromForm(form)).toEqual(room)
  })
})

describe('isRoomDirty', () => {
  const base = { id: 'a', name: 'A', price: 45000, features: ['Wifi'], photoKeys: ['k'], quantity: 1, position: 0, visible: true }
  const entry = (change = {}) => ({ base, form: { ...formFromRoom(base), ...change } })

  it('est faux pour une chambre inchangée (prix reformaté compris)', () => {
    expect(isRoomDirty(entry())).toBe(false)
    expect(isRoomDirty(entry({ price: '45000', features: 'Wifi\n\n' }))).toBe(false)
  })

  it('est vrai pour une chambre nouvelle', () => {
    expect(isRoomDirty({ base: null, form: formFromRoom(base) })).toBe(true)
  })

  it('est vrai dès qu’un champ change', () => {
    for (const change of [{ name: 'B' }, { price: '1' }, { quantity: '2' }, { visible: false }, { features: 'Wifi\nTV' }, { photoKeys: [] }]) {
      expect(isRoomDirty(entry(change))).toBe(true)
    }
  })

  it('est vrai pour une saisie invalide (à corriger)', () => {
    expect(isRoomDirty(entry({ price: 'abc' }))).toBe(true)
    expect(isRoomDirty(entry({ name: '' }))).toBe(true)
  })

  it('ignore la position', () => {
    expect(isRoomDirty(entry({ position: 7 }))).toBe(false)
  })
})
