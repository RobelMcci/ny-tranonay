import { describe, expect, it } from 'vitest'
import seed from '../data/content.seed.json'
import { pageFromRow, pageToRow, parsePriority, validatePageSeo } from './pages-map.js'

describe('pageFromRow / pageToRow', () => {
  it('fait l’aller-retour sur les pages du seed', () => {
    for (const page of seed.pages) {
      const row = { path: page.path, title: page.title, description: page.description, priority: page.priority, nav_label: page.navLabel }
      expect(pageFromRow(row)).toEqual(page)
      expect(pageToRow(page)).toEqual(row)
    }
  })

  it('convertit nav_label et une priorité renvoyée en texte (numeric)', () => {
    expect(pageFromRow({ path: '/x', title: 'T', description: 'D', priority: '0.8', nav_label: null })).toEqual({ path: '/x', title: 'T', description: 'D', priority: 0.8, navLabel: null })
    expect(pageToRow({ path: '/x', title: 'T', description: 'D', priority: 0.8, navLabel: 'Menu' }).nav_label).toBe('Menu')
  })
})

describe('parsePriority', () => {
  it.each([
    ['0.8', 0.8],
    ['0,8', 0.8],
    ['1', 1],
    ['0', 0],
    [' 0.5 ', 0.5],
    [0.3, 0.3],
    [1, 1],
  ])('accepte %j', (input, value) => expect(parsePriority(input)).toEqual({ ok: true, value }))

  it.each([['1.1'], ['-0.1'], ['0.85'], ['abc'], [''], ['  '], ['1,5'], [NaN], [null], ['0.8.1']])('refuse %j', (input) => {
    const result = parsePriority(input)
    expect(result.ok).toBe(false)
    expect(result.error).toEqual(expect.any(String))
  })
})

describe('validatePageSeo', () => {
  const ok = { path: '/x', title: 'Titre', description: 'Description', priority: '0,8', navLabel: '' }

  it('accepte une page valide, et les pages du seed', () => {
    expect(validatePageSeo(ok)).toEqual({})
    for (const page of seed.pages) expect(validatePageSeo(page)).toEqual({})
  })

  it('titre et description obligatoires', () => {
    const errors = validatePageSeo({ ...ok, title: ' ', description: '' })
    expect(Object.keys(errors).sort()).toEqual(['description', 'title'])
  })

  it('bornes dures : titre 120, description 300, libellé 40', () => {
    expect(validatePageSeo({ ...ok, title: 't'.repeat(120), description: 'd'.repeat(300), navLabel: 'n'.repeat(40) })).toEqual({})
    const errors = validatePageSeo({ ...ok, title: 't'.repeat(121), description: 'd'.repeat(301), navLabel: 'n'.repeat(41) })
    expect(errors.title).toContain('120')
    expect(errors.description).toContain('300')
    expect(errors.navLabel).toContain('40')
  })

  it('priorité invalide', () => {
    expect(validatePageSeo({ ...ok, priority: '2' }).priority).toEqual(expect.any(String))
  })
})
