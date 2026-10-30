import { describe, expect, it } from 'vitest'
import { getText, resolveText, textSlots } from './text-slots.js'

const PAGES = ['accueil', 'salle', 'privatisation', 'chambres', 'tarifs', 'contact']

// Clés exigées par le brief.
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
  'salle.hero.intro',
  'privatisation.hero.titre',
  'privatisation.hero.intro',
  'chambres.hero.titre',
  'chambres.hero.intro',
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
    const slot = textSlots.find((s) => s.key === 'accueil.hero.titre')
    const inherited = Object.create({ 'accueil.hero.titre': 'X' })
    expect(getText('accueil.hero.titre', inherited)).toBe(slot.default)
  })

  it('ignore une surcharge qui n’est pas une chaîne', () => {
    const slot = textSlots.find((s) => s.key === 'accueil.hero.titre')
    expect(getText('accueil.hero.titre', { 'accueil.hero.titre': 42 })).toBe(slot.default)
    expect(getText('accueil.hero.titre', { 'accueil.hero.titre': null })).toBe(slot.default)
  })

  it('refuse une clé héritée comme emplacement', () => {
    expect(() => getText('constructor', {})).toThrow('Emplacement de texte inconnu : constructor')
  })

  it('lève une erreur nommant la clé non déclarée', () => {
    expect(() => getText('inconnu.cle', {})).toThrow('Emplacement de texte inconnu : inconnu.cle')
  })
})

describe('resolveText', () => {
  const vars = { 'prix.reception_max_invites': '150', checkin: '10h', checkout: '10h le lendemain' }

  it('résout les variables d’un défaut', () => {
    expect(resolveText('salle.hero.intro', {}, vars)).toContain('Jusqu’à 150 personnes, de 8h30 à 18h.')
    expect(resolveText('chambres.hero.intro', {}, vars)).toContain('Check-in à partir de 10h, check-out à 10h le lendemain.')
    expect(resolveText('salle.hero.intro', {}, vars)).not.toContain('{{')
  })

  it('renvoie une surcharge telle quelle, sans la réinterpoler', () => {
    expect(resolveText('salle.hero.intro', { 'salle.hero.intro': 'Reste {{tel}} brut' }, vars)).toBe('Reste {{tel}} brut')
  })

  it('lève en nommant une variable inconnue du défaut', () => {
    expect(() => resolveText('salle.hero.intro', {}, {})).toThrow('{{prix.reception_max_invites}}')
  })

  it('lève pour une clé non déclarée', () => {
    expect(() => resolveText('inconnu.cle', {}, vars)).toThrow('Emplacement de texte inconnu : inconnu.cle')
  })
})
