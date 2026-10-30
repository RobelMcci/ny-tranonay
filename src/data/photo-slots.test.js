import { describe, expect, it } from 'vitest'
import seed from './content.seed.json'
import { fixedPhotoUsages, photoSlots } from './photo-slots.js'

describe('photoSlots', () => {
  it('définit 27 emplacements aux clés uniques et aux libellés renseignés', () => {
    expect(photoSlots).toHaveLength(27)
    expect(new Set(photoSlots.map((slot) => slot.key)).size).toBe(27)
    for (const slot of photoSlots) {
      expect(slot.label).toBeTruthy()
      expect(slot.page).toBeTruthy()
    }
  })

  it('a pour défaut une photo existante du seed', () => {
    const keys = new Set(seed.photos.map((photo) => photo.key))
    for (const slot of photoSlots) expect(keys.has(slot.default), slot.key).toBe(true)
  })
})

describe('fixedPhotoUsages', () => {
  it('ne cite que des photos existantes du seed, avec un lieu renseigné', () => {
    const keys = new Set(seed.photos.map((photo) => photo.key))
    expect(fixedPhotoUsages.length).toBeGreaterThan(0)
    for (const { photoKey, where } of fixedPhotoUsages) {
      expect(keys.has(photoKey), photoKey).toBe(true)
      expect(where).toBeTruthy()
    }
  })

  it('n’a pas de doublon exact', () => {
    const lines = fixedPhotoUsages.map(({ photoKey, where }) => `${photoKey}|${where}`)
    expect(new Set(lines).size).toBe(lines.length)
  })

  it('couvre les photos codées en dur dans les pages', () => {
    const keys = new Set(fixedPhotoUsages.map((usage) => usage.photoKey))
    for (const key of ['facadeJour', 'chambreTwin', 'salleLongue', 'tableDressee', 'salle', 'tables', 'piscine']) {
      expect(keys.has(key), key).toBe(true)
    }
  })
})
