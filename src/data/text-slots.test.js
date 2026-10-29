import { describe, expect, it } from 'vitest'
import { getText, textSlots } from './text-slots.js'

const PAGES = ['accueil', 'salle', 'privatisation', 'chambres', 'tarifs', 'contact']

// Clés exigées par le brief. `salle.hero.intro` et `chambres.hero.intro` en sont absentes : leur texte actuel
// intègre des valeurs calculées (capacité, heures d'arrivée/départ) et reste donc dans le code.
const REQUIRED_KEYS = [
  'accueil.hero.eyebrow',
  'accueil.hero.titre',
  'accueil.hero.sous-titre',
  'accueil.offre.salle.titre',
  'accueil.offre.salle.texte',
  'accueil.offre.privatisation.titre',
  'accueil.offre.privatisation.texte',
  'accueil.offre.chambres.titre',
  'accueil.offre.chambres.texte',
  'salle.hero.titre',
  'privatisation.hero.titre',
  'privatisation.hero.intro',
  'chambres.hero.titre',
  'tarifs.hero.titre',
  'tarifs.hero.intro',
  'contact.hero.titre',
  'contact.hero.intro',
]

describe('textSlots', () => {
  it('a des clés uniques', () => {
    const keys = textSlots.map((slot) => slot.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('a pour chaque emplacement un libellé et un défaut non vides', () => {
    for (const slot of textSlots) {
      expect(typeof slot.label, slot.key).toBe('string')
      expect(slot.label.trim(), slot.key).not.toBe('')
      expect(typeof slot.default, slot.key).toBe('string')
      expect(slot.default.trim(), slot.key).not.toBe('')
    }
  })

  it('rattache chaque emplacement à une page connue', () => {
    for (const slot of textSlots) expect(PAGES, slot.key).toContain(slot.page)
  })

  it('déclare toutes les clés attendues', () => {
    const keys = new Set(textSlots.map((slot) => slot.key))
    for (const key of REQUIRED_KEYS) expect(keys.has(key), key).toBe(true)
  })

  it('indique le mode multiligne par un booléen', () => {
    for (const slot of textSlots) expect(typeof slot.multiline, slot.key).toBe('boolean')
  })
})

describe('getText', () => {
  it('renvoie le défaut sans surcharge', () => {
    const slot = textSlots.find((s) => s.key === 'accueil.hero.titre')
    expect(getText('accueil.hero.titre', {})).toBe(slot.default)
  })

  it('renvoie la surcharge quand elle existe', () => {
    expect(getText('accueil.hero.titre', { 'accueil.hero.titre': 'X' })).toBe('X')
  })

  it('traite une surcharge vide comme absente', () => {
    const slot = textSlots.find((s) => s.key === 'accueil.hero.titre')
    expect(getText('accueil.hero.titre', { 'accueil.hero.titre': '' })).toBe(slot.default)
  })

  it('ignore les propriétés héritées de texts', () => {
    expect(() => getText('constructor', {})).toThrow('Emplacement de texte inconnu : constructor')
  })

  it('lève une erreur nommant la clé non déclarée', () => {
    expect(() => getText('inconnu.cle', {})).toThrow('Emplacement de texte inconnu : inconnu.cle')
  })
})
