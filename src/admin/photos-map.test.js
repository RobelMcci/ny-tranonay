import { describe, expect, it } from 'vitest'
import {
  MAX_ALT,
  MAX_CATEGORY,
  categoriesOf,
  effectiveSlotPhoto,
  formFromPhoto,
  isPhotoDirty,
  photoChangeBlock,
  photoFromRow,
  photoMetaFromForm,
  photoToRow,
  photoUsages,
  validatePhotoMeta,
} from './photos-map.js'

const row = {
  key: 'piscine',
  file: 'image3',
  storage_path: null,
  alt: 'La piscine',
  category: 'Piscine',
  width: 2048,
  height: 1536,
  gallery_position: 4,
  visible: true,
}
const photo = { key: 'piscine', file: 'image3', storagePath: null, alt: 'La piscine', category: 'Piscine', width: 2048, height: 1536, galleryPosition: 4, visible: true }

describe('photoFromRow / photoToRow', () => {
  it('convertit une ligne SQL en photo', () => {
    expect(photoFromRow(row)).toEqual(photo)
  })

  it('conserve les valeurs nulles (photo téléversée hors galerie)', () => {
    const uploaded = photoFromRow({ ...row, file: null, storage_path: 'abc.jpg', gallery_position: null })
    expect(uploaded).toMatchObject({ file: null, storagePath: 'abc.jpg', galleryPosition: null })
  })

  it('fait l’aller-retour', () => {
    expect(photoToRow(photoFromRow(row))).toEqual(row)
    const uploaded = { ...row, file: null, storage_path: 'abc.jpg', gallery_position: null, visible: false }
    expect(photoToRow(photoFromRow(uploaded))).toEqual(uploaded)
  })
})

describe('validatePhotoMeta', () => {
  const valid = { alt: 'Une photo', category: 'Piscine', galleryPosition: '' }

  it('accepte une saisie valide', () => {
    expect(validatePhotoMeta(valid)).toEqual({})
    expect(validatePhotoMeta({ ...valid, galleryPosition: null })).toEqual({})
    expect(validatePhotoMeta({ ...valid, galleryPosition: undefined })).toEqual({})
  })

  it('exige le texte alternatif (espaces seuls refusés) et le borne', () => {
    expect(validatePhotoMeta({ ...valid, alt: '' }).alt).toMatch(/obligatoire/)
    expect(validatePhotoMeta({ ...valid, alt: '   ' }).alt).toMatch(/obligatoire/)
    expect(validatePhotoMeta({ ...valid, alt: 'a'.repeat(MAX_ALT) }).alt).toBeUndefined()
    expect(validatePhotoMeta({ ...valid, alt: 'a'.repeat(MAX_ALT + 1) }).alt).toMatch(/200/)
  })

  it('exige la catégorie et la borne', () => {
    expect(validatePhotoMeta({ ...valid, category: ' ' }).category).toMatch(/obligatoire/)
    expect(validatePhotoMeta({ ...valid, category: 'c'.repeat(MAX_CATEGORY) }).category).toBeUndefined()
    expect(validatePhotoMeta({ ...valid, category: 'c'.repeat(MAX_CATEGORY + 1) }).category).toMatch(/40/)
  })

  it('accepte un rang vide, nul ou entier de 0 à 999 (texte ou nombre)', () => {
    for (const galleryPosition of ['', '  ', null, 0, '0', 5, ' 12 ', 999, '999']) {
      expect(validatePhotoMeta({ ...valid, galleryPosition }).galleryPosition, String(galleryPosition)).toBeUndefined()
    }
  })

  it('refuse un rang négatif, décimal, trop grand ou non numérique', () => {
    for (const galleryPosition of [-1, '-1', 1.5, '1,5', '1.5', 1000, '1000', 'abc', '12 a', Number.NaN]) {
      expect(validatePhotoMeta({ ...valid, galleryPosition }).galleryPosition, String(galleryPosition)).toMatch(/0 et 999|entier/)
    }
  })
})

describe('formulaire', () => {
  it('convertit en valeurs de formulaire (texte) et retour', () => {
    expect(formFromPhoto(photo)).toEqual({ alt: 'La piscine', category: 'Piscine', galleryPosition: '4', visible: true })
    expect(formFromPhoto({ ...photo, galleryPosition: null }).galleryPosition).toBe('')
    expect(photoMetaFromForm({ alt: '  Nouvelle ', category: ' Soirée ', galleryPosition: ' 7 ', visible: false })).toEqual({
      alt: 'Nouvelle',
      category: 'Soirée',
      galleryPosition: 7,
      visible: false,
    })
    expect(photoMetaFromForm({ alt: 'a', category: 'b', galleryPosition: '', visible: true }).galleryPosition).toBeNull()
  })

  it('détecte les modifications', () => {
    expect(isPhotoDirty({ base: photo, form: formFromPhoto(photo) })).toBe(false)
    expect(isPhotoDirty({ base: photo, form: { ...formFromPhoto(photo), alt: 'Autre' } })).toBe(true)
    expect(isPhotoDirty({ base: photo, form: { ...formFromPhoto(photo), alt: ' La piscine ' } })).toBe(false)
    expect(isPhotoDirty({ base: photo, form: { ...formFromPhoto(photo), visible: false } })).toBe(true)
    expect(isPhotoDirty({ base: photo, form: { ...formFromPhoto(photo), galleryPosition: '' } })).toBe(true)
    expect(isPhotoDirty({ base: photo, form: { ...formFromPhoto(photo), galleryPosition: 'abc' } })).toBe(true)
  })
})

describe('categoriesOf', () => {
  it('liste les catégories une fois, triées', () => {
    expect(categoriesOf([{ category: 'Soirée' }, { category: 'Chambres' }, { category: 'Soirée' }, { category: '' }])).toEqual(['Chambres', 'Soirée'])
  })
})

describe('effectiveSlotPhoto', () => {
  const slot = { key: 'hero.1', default: 'facadeJour' }
  it('renvoie la surcharge, sinon le défaut', () => {
    expect(effectiveSlotPhoto(slot, {})).toEqual({ photoKey: 'facadeJour', overridden: false })
    expect(effectiveSlotPhoto(slot, { 'hero.1': 'piscine' })).toEqual({ photoKey: 'piscine', overridden: true })
    expect(effectiveSlotPhoto(slot, { 'hero.2': 'piscine' })).toEqual({ photoKey: 'facadeJour', overridden: false })
  })
})

describe('photoUsages', () => {
  const defaults = [
    { key: 'hero.1', label: 'Bandeau d’accueil, 1re photo', default: 'facadeJour' },
    { key: 'hero.2', label: 'Bandeau d’accueil, 2e photo', default: 'piscine' },
    { key: 'hero.3', label: 'Bandeau d’accueil, 3e photo', default: 'piscine' },
  ]
  const base = { slots: {}, defaults, rooms: [], fixedKeys: [] }

  it('n’est pas bloquant quand la photo n’est utilisée nulle part', () => {
    expect(photoUsages({ ...base, photoKey: 'escalier' })).toEqual({ usages: [], blocking: false })
  })

  it('signale un emplacement qui la reçoit par défaut', () => {
    expect(photoUsages({ ...base, photoKey: 'facadeJour' })).toEqual({
      usages: ['Emplacement « Bandeau d’accueil, 1re photo » (photo par défaut)'],
      blocking: true,
    })
  })

  it('signale un emplacement qui la reçoit par surcharge', () => {
    const result = photoUsages({ ...base, photoKey: 'escalier', slots: { 'hero.1': 'escalier' } })
    expect(result).toEqual({ usages: ['Emplacement « Bandeau d’accueil, 1re photo » (photo choisie)'], blocking: true })
  })

  it('ne compte pas le défaut d’un emplacement surchargé par une autre photo', () => {
    const result = photoUsages({ ...base, photoKey: 'facadeJour', slots: { 'hero.1': 'escalier' } })
    expect(result).toEqual({ usages: [], blocking: false })
  })

  it('compte une fois par emplacement, défauts et surcharges mêlés', () => {
    const result = photoUsages({ ...base, photoKey: 'piscine', slots: { 'hero.3': 'escalier', 'hero.1': 'piscine' } })
    expect(result.usages).toEqual([
      'Emplacement « Bandeau d’accueil, 1re photo » (photo choisie)',
      'Emplacement « Bandeau d’accueil, 2e photo » (photo par défaut)',
    ])
  })

  it('signale les chambres qui la listent (visibles ou non)', () => {
    const rooms = [
      { id: 'twin', name: 'Chambre twin', photoKeys: ['chambreTwin', 'escalier'] },
      { id: 'double', name: 'Chambre double', photoKeys: ['escalier'] },
      { id: 'autre', name: 'Autre', photoKeys: [] },
    ]
    expect(photoUsages({ ...base, photoKey: 'escalier', rooms })).toEqual({
      usages: ['Chambre « Chambre twin »', 'Chambre « Chambre double »'],
      blocking: true,
    })
  })

  it('signale les emplacements fixes du site', () => {
    const fixedKeys = [
      { photoKey: 'facadeJour', where: 'page Contact' },
      { photoKey: 'facadeJour', where: 'page Privatisation' },
      { photoKey: 'salle', where: 'page Salle' },
    ]
    const result = photoUsages({ ...base, photoKey: 'facadeJour', slots: { 'hero.1': 'escalier' }, fixedKeys })
    expect(result).toEqual({
      usages: ['Emplacement fixe du site (page Contact)', 'Emplacement fixe du site (page Privatisation)'],
      blocking: true,
    })
  })

  it('tolère des données absentes', () => {
    expect(photoUsages({ photoKey: 'x' })).toEqual({ usages: [], blocking: false })
  })
})

describe('photoChangeBlock', () => {
  const ctx = {
    slots: { 'hero.1': 'escalier' },
    defaults: [{ key: 'hero.1', label: 'Bandeau', default: 'facadeJour' }],
    rooms: [{ id: 'twin', name: 'Chambre twin', photoKeys: ['chambreVerte'] }],
    fixedKeys: [
      { photoKey: 'piscine', where: 'invitation à partager' },
      { photoKey: 'facadeJour', where: 'page Contact' },
      { photoKey: 'facadeJour', where: 'page Privatisation' },
    ],
  }

  it('ne refuse rien pour une photo libre', () => {
    expect(photoChangeBlock({ ...ctx, photoKey: 'tentes', action: 'delete' })).toBeNull()
    expect(photoChangeBlock({ ...ctx, photoKey: 'tentes', action: 'hide' })).toBeNull()
  })

  it('refuse une photo à emplacement fixe avec le message dédié', () => {
    expect(photoChangeBlock({ ...ctx, photoKey: 'piscine', action: 'hide' })).toBe(
      'Cette photo est utilisée à un emplacement fixe du site (invitation à partager) : elle ne peut pas être masquée ni supprimée.',
    )
    expect(photoChangeBlock({ ...ctx, photoKey: 'facadeJour', action: 'delete' })).toBe(
      'Cette photo est utilisée à un emplacement fixe du site (page Contact, page Privatisation) : elle ne peut pas être masquée ni supprimée.',
    )
  })

  it('refuse une photo choisie pour un emplacement ou une chambre, en listant les usages', () => {
    const slot = photoChangeBlock({ ...ctx, photoKey: 'escalier', action: 'delete' })
    expect(slot).toContain('Emplacement « Bandeau » (photo choisie)')
    expect(slot).toMatch(/supprimer/)
    const room = photoChangeBlock({ ...ctx, photoKey: 'chambreVerte', action: 'hide' })
    expect(room).toContain('Chambre « Chambre twin »')
    expect(room).toMatch(/masquer/)
  })
})
