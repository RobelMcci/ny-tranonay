import { afterEach, describe, expect, it, vi } from 'vitest'
import seed from '../data/content.seed.json'
import { buildRegistry, galleryKeysOf, resolvePhoto, roomPhotoKeysOf } from './photo-registry.js'

const rows = [
  { key: 'facadeJour', file: 'image36', storagePath: null, alt: 'Façade', category: 'Espace', width: 2048, height: 1536, galleryPosition: 0 },
  { key: 'piscine', file: 'image10', storagePath: null, alt: 'Piscine', category: 'Piscine', width: 2048, height: 1536, galleryPosition: 1 },
  { key: 'cms1', file: 'cms/cms1', storagePath: 'x/cms1.jpg', alt: 'Téléversée', category: 'Espace', width: 1000, height: 800, galleryPosition: null },
]
const srcsets = { '../assets/image36.jpg': 'a 480w', '../assets/image10.jpg': 'b 480w', '../assets/cms/cms1.jpg': 'c 480w' }
const fallbacks = { '../assets/image36.jpg': '/a.webp', '../assets/image10.jpg': '/b.webp', '../assets/cms/cms1.jpg': '/c.webp' }
const defaults = { 'hero.1': 'facadeJour', 'hero.2': 'piscine' }

afterEach(() => vi.restoreAllMocks())

describe('buildRegistry', () => {
  it('associe chaque ligne à son srcset et à son image de repli', () => {
    const registry = buildRegistry(rows, { srcsets, fallbacks })
    expect(registry.facadeJour).toEqual({
      src: '/a.webp', srcSet: 'a 480w', width: 2048, height: 1536, alt: 'Façade', category: 'Espace',
    })
    expect(registry.cms1.src).toBe('/c.webp')
    expect(Object.keys(registry)).toEqual(['facadeJour', 'piscine', 'cms1'])
  })

  it('ignore et signale chaque ligne dont le fichier manque', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const registry = buildRegistry(rows, { srcsets: { '../assets/image36.jpg': 'a' }, fallbacks: { '../assets/image36.jpg': '/a' } })
    expect(Object.keys(registry)).toEqual(['facadeJour'])
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('signale exactement une fois pour un seul fichier manquant', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const without = (map) => Object.fromEntries(Object.entries(map).filter(([path]) => !path.includes('cms1')))
    const registry = buildRegistry(rows, { srcsets: without(srcsets), fallbacks: without(fallbacks) })
    expect(Object.keys(registry)).toEqual(['facadeJour', 'piscine'])
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('cms1')
  })

  it('ignore une ligne sans fichier', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const registry = buildRegistry([{ ...rows[0], file: null }], { srcsets, fallbacks })
    expect(registry).toEqual({})
    expect(warn).toHaveBeenCalledTimes(1)
  })
})

describe('resolvePhoto', () => {
  const registry = buildRegistry(rows, { srcsets, fallbacks })

  it('renvoie la photo par défaut d’un emplacement sans surcharge', () => {
    expect(resolvePhoto('hero.1', registry, {}, defaults)).toBe(registry.facadeJour)
  })

  it('applique la surcharge de l’emplacement', () => {
    expect(resolvePhoto('hero.1', registry, { 'hero.1': 'piscine' }, defaults)).toBe(registry.piscine)
  })

  it('retombe sur la photo par défaut si la surcharge vise une clé absente', () => {
    expect(resolvePhoto('hero.1', registry, { 'hero.1': 'supprimee' }, defaults)).toBe(registry.facadeJour)
  })

  it('retombe sur la première photo du registre si le défaut est aussi absent', () => {
    expect(resolvePhoto('hero.1', registry, { 'hero.1': 'supprimee' }, { 'hero.1': 'absente' })).toBe(registry.facadeJour)
    const small = { piscine: registry.piscine, cms1: registry.cms1 }
    expect(resolvePhoto('hero.1', small, {}, defaults)).toBe(registry.piscine)
  })

  it('accepte une clé de photo directe', () => {
    expect(resolvePhoto('piscine', registry, {}, defaults)).toBe(registry.piscine)
    expect(resolvePhoto('piscine', registry, { 'hero.1': 'cms1' }, defaults)).toBe(registry.piscine)
  })

  it('retombe sur la première photo pour une clé directe inconnue', () => {
    expect(resolvePhoto('inconnue', registry, {}, defaults)).toBe(registry.facadeJour)
  })

  it('ne confond pas une clé héritée d’Object avec une photo ou un emplacement', () => {
    expect(resolvePhoto('constructor', registry, {}, defaults)).toBe(registry.facadeJour)
  })

  it('renvoie undefined sans exception si le registre est vide', () => {
    expect(() => resolvePhoto('hero.1', {}, {}, defaults)).not.toThrow()
    expect(resolvePhoto('hero.1', {}, {}, defaults)).toBeUndefined()
  })

  it('tolère des surcharges et défauts absents', () => {
    expect(resolvePhoto('piscine', registry)).toBe(registry.piscine)
  })
})

describe('galleryKeysOf et roomPhotoKeysOf', () => {
  const all = Object.fromEntries(seed.photos.map((row) => [row.key, {}]))

  it('ordonne les chambres du seed par rang de galerie', () => {
    expect(roomPhotoKeysOf(seed.photos, all)).toEqual([
      'chambreTwin', 'chambreVerte', 'chambreRose', 'chambreViolette', 'chambreOrange', 'chambreTV',
    ])
  })

  it('ordonne la galerie du seed par rang', () => {
    const expected = [...seed.photos].filter((p) => p.galleryPosition != null).sort((a, b) => a.galleryPosition - b.galleryPosition).map((p) => p.key)
    expect(galleryKeysOf(seed.photos, all)).toEqual(expected)
    expect(galleryKeysOf(seed.photos, all)).toHaveLength(32)
  })

  it('ne dépend pas de l’ordre des lignes (ordre alphabétique de la base)', () => {
    const alphabetical = [...seed.photos].sort((a, b) => (a.key < b.key ? -1 : 1))
    expect(roomPhotoKeysOf(alphabetical, all)).toEqual(roomPhotoKeysOf(seed.photos, all))
    expect(galleryKeysOf(alphabetical, all)).toEqual(galleryKeysOf(seed.photos, all))
  })

  it('départage par clé, place les chambres sans rang en dernier, ignore les photos hors registre', () => {
    const rows = [
      { key: 'b', category: 'Chambres', galleryPosition: 1 },
      { key: 'a', category: 'Chambres', galleryPosition: 1 },
      { key: 'z', category: 'Chambres', galleryPosition: null },
      { key: 'c', category: 'Chambres', galleryPosition: 0 },
      { key: 'ghost', category: 'Chambres', galleryPosition: 0 },
      { key: 'x', category: 'Espace', galleryPosition: 2 },
    ]
    const registry = { a: {}, b: {}, c: {}, z: {}, x: {} }
    expect(roomPhotoKeysOf(rows, registry)).toEqual(['c', 'a', 'b', 'z'])
    expect(galleryKeysOf(rows, registry)).toEqual(['c', 'a', 'b', 'x'])
  })
})
