import { describe, expect, it } from 'vitest'
import { moveItem, withPositions } from './reorder.js'

describe('moveItem', () => {
  it('déplace un élément vers la fin', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
  })

  it('déplace un élément vers le début', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
  })

  it('échange deux voisins', () => {
    expect(moveItem(['a', 'b', 'c'], 1, 2)).toEqual(['a', 'c', 'b'])
  })

  it('renvoie le même contenu dans un nouveau tableau quand from === to', () => {
    const items = ['a', 'b', 'c']
    const result = moveItem(items, 1, 1)
    expect(result).toEqual(['a', 'b', 'c'])
    expect(result).not.toBe(items)
  })

  it('laisse le tableau inchangé pour des indices hors bornes', () => {
    const items = ['a', 'b', 'c']
    for (const [from, to] of [[0, 3], [3, 0], [0, 99], [-1, 1], [1, -1], [-2, -1], [1.5, 0]]) {
      const result = moveItem(items, from, to)
      expect(result).toEqual(['a', 'b', 'c'])
      expect(result).not.toBe(items)
    }
  })

  it('gère un tableau vide', () => {
    expect(moveItem([], 0, 0)).toEqual([])
    expect(moveItem([], 0, 1)).toEqual([])
  })

  it('ne mute pas l’entrée', () => {
    const items = Object.freeze(['a', 'b', 'c'])
    expect(moveItem(items, 0, 2)).toEqual(['b', 'c', 'a'])
    expect(items).toEqual(['a', 'b', 'c'])
  })

  it('conserve les mêmes objets (références) dans le résultat', () => {
    const a = { id: 1 }
    const b = { id: 2 }
    const result = moveItem([a, b], 0, 1)
    expect(result[0]).toBe(b)
    expect(result[1]).toBe(a)
  })
})

describe('withPositions', () => {
  it('numérote à partir de 0', () => {
    expect(withPositions([{ id: 'x' }, { id: 'y' }, { id: 'z' }])).toEqual([
      { id: 'x', position: 0 },
      { id: 'y', position: 1 },
      { id: 'z', position: 2 },
    ])
  })

  it('remplace une position existante', () => {
    expect(withPositions([{ id: 'x', position: 9 }, { id: 'y', position: 4 }])).toEqual([
      { id: 'x', position: 0 },
      { id: 'y', position: 1 },
    ])
  })

  it('renvoie un tableau vide pour une entrée vide', () => {
    expect(withPositions([])).toEqual([])
  })

  it('ne mute pas l’entrée et crée de nouveaux objets', () => {
    const first = Object.freeze({ id: 'x' })
    const items = Object.freeze([first])
    const result = withPositions(items)
    expect(result[0]).not.toBe(first)
    expect(first).toEqual({ id: 'x' })
    expect('position' in first).toBe(false)
  })
})
