import { describe, expect, it } from 'vitest'
import { roomPriceRange } from './rooms.js'

describe('roomPriceRange', () => {
  it('renvoie null sans chambre', () => {
    expect(roomPriceRange([])).toBeNull()
    expect(roomPriceRange(undefined)).toBeNull()
  })

  it('une seule chambre : min et max sont égaux', () => {
    expect(roomPriceRange([{ price: 45000 }])).toEqual({ min: 45000, max: 45000 })
  })

  it('plusieurs chambres', () => {
    expect(roomPriceRange([{ price: 50000 }, { price: 45000 }, { price: 60000 }])).toEqual({ min: 45000, max: 60000 })
  })

  it('ne dépend pas de l’ordre', () => {
    const rooms = [{ price: 55000 }, { price: 45000 }, { price: 60000 }, { price: 50000 }]
    expect(roomPriceRange([...rooms].reverse())).toEqual(roomPriceRange(rooms))
  })
})
