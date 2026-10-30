import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { seedRows } from './seed-rows.mjs'

const seed = JSON.parse(readFileSync(new URL('../../src/data/content.seed.json', import.meta.url), 'utf8'))
const LIST_KEYS = ['inclus_privatisation', 'inclus_reception', 'extras', 'activites', 'pack_couple', 'types_evenement']

const isSequence = (rows) => rows.map((row) => row.position).every((position, index) => position === index)

describe('seedRows', () => {
  const rows = seedRows(seed)

  it('produit une ligne de réglages avec id 1 et les colonnes en snake_case', () => {
    expect(rows.settings).toHaveLength(1)
    expect(rows.settings[0].id).toBe(1)
    expect(rows.settings[0].whatsapp_number).toBe(seed.settings.whatsappNumber)
    expect(rows.settings[0].security_partner_url).toBe(seed.settings.securityPartnerUrl)
    expect(Object.keys(rows.settings[0])).toHaveLength(Object.keys(seed.settings).length + 1)
  })

  it('produit les 7 prix tels que dans le seed', () => {
    expect(rows.prices).toHaveLength(7)
    expect(rows.prices).toEqual(seed.prices.map(({ key, label, amount, unit }) => ({ key, label, amount, unit })))
  })

  it('numérote les chambres de 0 à n-1, visibles, avec quantité, photos et prix', () => {
    expect(rows.rooms).toHaveLength(seed.rooms.length)
    expect(isSequence(rows.rooms)).toBe(true)
    rows.rooms.forEach((row, index) => {
      const room = seed.rooms[index]
      expect(row).toEqual({
        id: room.id,
        name: room.name,
        price_ar: room.price,
        features: room.features,
        photo_keys: room.photoKeys,
        quantity: room.quantity,
        position: index,
        visible: true,
      })
    })
  })

  it('numérote les FAQ de 0 à n-1 sans id (colonne générée)', () => {
    expect(rows.faqs).toHaveLength(seed.faqs.length)
    expect(isSequence(rows.faqs)).toBe(true)
    for (const row of rows.faqs) {
      expect('id' in row).toBe(false)
      expect(row.visible).toBe(true)
    }
    expect(rows.faqs.map((row) => row.question)).toEqual(seed.faqs.map((faq) => faq.question))
  })

  it('range chaque élément de chaque liste une seule fois, dans l’ordre, sans id', () => {
    const total = LIST_KEYS.reduce((sum, key) => sum + seed.lists[key].length, 0)
    expect(rows.list_items).toHaveLength(total)
    for (const key of LIST_KEYS) {
      const items = rows.list_items.filter((row) => row.list_key === key)
      expect(items.map((row) => row.label)).toEqual(seed.lists[key])
      expect(isSequence(items)).toBe(true)
    }
    for (const row of rows.list_items) {
      expect('id' in row).toBe(false)
      expect(row.visible).toBe(true)
      expect(Object.keys(row).sort()).toEqual(['label', 'list_key', 'position', 'visible'])
    }
  })

  it('produit les pages de référencement', () => {
    expect(rows.pages_seo).toHaveLength(seed.pages.length)
    expect(rows.pages_seo[0]).toEqual({
      path: seed.pages[0].path,
      title: seed.pages[0].title,
      description: seed.pages[0].description,
      priority: seed.pages[0].priority,
      nav_label: seed.pages[0].navLabel,
      position: 0,
    })
  })

  it('donne aux pages les positions 0…n-1 dans l’ordre du seed (ordre du menu)', () => {
    expect(rows.pages_seo.map((row) => row.path)).toEqual(seed.pages.map((page) => page.path))
    expect(isSequence(rows.pages_seo)).toBe(true)
  })

  it('produit les photos du seed : fichier renseigné, storage_path nul, visibles', () => {
    expect(rows.photos).toHaveLength(seed.photos.length)
    for (const row of rows.photos) {
      expect(row.file).toEqual(expect.any(String))
      expect(row.storage_path).toBeNull()
      expect(row.visible).toBe(true)
    }
    expect(rows.photos[0]).toEqual({
      key: seed.photos[0].key,
      file: seed.photos[0].file,
      storage_path: null,
      alt: seed.photos[0].alt,
      category: seed.photos[0].category,
      width: seed.photos[0].width,
      height: seed.photos[0].height,
      gallery_position: seed.photos[0].galleryPosition,
      visible: true,
    })
  })

  it('ne génère que des surcharges vides pour les emplacements et les textes', () => {
    expect(rows.photo_slots).toEqual([])
    expect(rows.texts).toEqual([])
  })

  it('est déterministe et ne modifie pas son entrée', () => {
    const before = JSON.stringify(seed)
    expect(seedRows(seed)).toEqual(seedRows(seed))
    expect(JSON.stringify(seed)).toBe(before)
  })

  it('ne fournit que les tables attendues', () => {
    expect(Object.keys(rows).sort()).toEqual(
      ['faqs', 'list_items', 'pages_seo', 'photo_slots', 'photos', 'prices', 'rooms', 'settings', 'texts'].sort(),
    )
  })
})
