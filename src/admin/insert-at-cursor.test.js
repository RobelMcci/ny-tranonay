import { describe, expect, it } from 'vitest'
import { insertAtCursor } from './insert-at-cursor.js'

describe('insertAtCursor', () => {
  it('insère au début', () => {
    expect(insertAtCursor('abc', 0, 0, 'X')).toEqual({ value: 'Xabc', caret: 1 })
  })

  it('insère au milieu', () => {
    expect(insertAtCursor('abcd', 2, 2, '{{tel}}')).toEqual({ value: 'ab{{tel}}cd', caret: 9 })
  })

  it('insère à la fin', () => {
    expect(insertAtCursor('abc', 3, 3, 'X')).toEqual({ value: 'abcX', caret: 4 })
  })

  it('remplace la sélection', () => {
    expect(insertAtCursor('abcdef', 1, 4, 'X')).toEqual({ value: 'aXef', caret: 2 })
  })

  it('valeur vide', () => {
    expect(insertAtCursor('', 0, 0, '{{email}}')).toEqual({ value: '{{email}}', caret: 9 })
  })

  it('sans curseur connu (null/undefined) : ajoute à la fin', () => {
    expect(insertAtCursor('abc', null, null, 'X')).toEqual({ value: 'abcX', caret: 4 })
    expect(insertAtCursor('abc', undefined, undefined, 'X')).toEqual({ value: 'abcX', caret: 4 })
  })

  it('borne un curseur hors limites et inverse une sélection à l’envers', () => {
    expect(insertAtCursor('abc', 99, 99, 'X')).toEqual({ value: 'abcX', caret: 4 })
    expect(insertAtCursor('abcdef', 4, 1, 'X')).toEqual({ value: 'aXef', caret: 2 })
  })
})
