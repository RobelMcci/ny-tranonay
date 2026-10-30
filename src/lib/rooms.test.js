import { describe, expect, it } from 'vitest'
import { roomHourShort, roomPriceRange, roomTypesLabel } from './rooms.js'

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

describe('roomTypesLabel', () => {
  it('aucune chambre : null (la page garde sa phrase neutre)', () => {
    expect(roomTypesLabel(0)).toBeNull()
    expect(roomTypesLabel(-1)).toBeNull()
    expect(roomTypesLabel(Number.NaN)).toBeNull()
  })

  it('une chambre : singulier', () => {
    expect(roomTypesLabel(1)).toBe('Un type de chambre')
    expect(roomTypesLabel(1, { pluralNoun: true, adjective: 'climatisée' })).toBe('Un type de chambre climatisée')
  })

  it('quatre chambres : les deux formulations actuelles du site, à l’identique', () => {
    // Page Chambres : « Quatre types de chambre, de … » ; accueil : « Quatre types de chambres climatisées, de … ».
    expect(roomTypesLabel(4)).toBe('Quatre types de chambre')
    expect(roomTypesLabel(4, { pluralNoun: true, adjective: 'climatisée' })).toBe('Quatre types de chambres climatisées')
  })

  it('nombres en lettres de 2 à 9, en chiffres au-delà', () => {
    const words = ['Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf']
    words.forEach((word, index) => expect(roomTypesLabel(index + 2)).toBe(`${word} types de chambre`))
    expect(roomTypesLabel(10)).toBe('10 types de chambre')
    expect(roomTypesLabel(12, { pluralNoun: true })).toBe('12 types de chambres')
  })
})

describe('roomHourShort', () => {
  it('garde l’heure en tête d’un horaire libre', () => {
    expect(roomHourShort('10h')).toBe('10h')
    expect(roomHourShort('10h le lendemain')).toBe('10h')
    expect(roomHourShort('  9h30 le lendemain ')).toBe('9h30')
    expect(roomHourShort('11 h, le lendemain')).toBe('11 h')
  })

  it('renvoie le texte entier quand il ne commence pas par une heure', () => {
    expect(roomHourShort('midi')).toBe('midi')
    expect(roomHourShort('à partir de 14h')).toBe('à partir de 14h')
    expect(roomHourShort('')).toBe('')
    expect(roomHourShort(undefined)).toBe('')
  })
})
