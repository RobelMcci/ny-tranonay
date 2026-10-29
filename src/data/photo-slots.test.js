import { describe, expect, it } from 'vitest'
import seed from './content.seed.json'
import { photoSlots } from './photo-slots.js'

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
