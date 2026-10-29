import { describe, expect, it } from 'vitest'
import seed from '../data/content.seed.json'
import { formFromRoom, parseFeatures, roomFromForm, roomFromRow, roomToRow, slugify, validateRoom } from './rooms-map.js'

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

  it('traite les ligatures et caractères non latins comme des séparateurs', () => {
    expect(slugify('Æ Café 東京', [])).toBe('cafe')
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
