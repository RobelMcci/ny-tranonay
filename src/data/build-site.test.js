import { describe, expect, it } from 'vitest'
import { buildSite } from './build-site.js'
import seed from './content.seed.json'
import legacy from './legacy-site.fixture.json'

// Normalise les espaces (insécables comprises) de toutes les chaînes d'une valeur.
const norm = (value) => {
  if (typeof value === 'string') return value.replace(/\s/g, ' ')
  if (Array.isArray(value)) return value.map(norm)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, norm(v)]))
  return value
}

const clone = (value) => structuredClone(value)

// Seul changement de texte voulu : la description de /chambres affiche désormais « Ar » après
// chaque borne (« De 45 000 Ar à 60 000 Ar la nuit »), car {{chambre_min}} et {{chambre_max}} sont formatés en Ar.
const expected = clone(legacy)
const chambres = expected.pages.find((p) => p.path === '/chambres')
chambres.description = chambres.description.replace('De 45 000 à 60 000 Ar la nuit', 'De 45 000 Ar à 60 000 Ar la nuit')

const site = buildSite(seed)

describe('buildSite(seed) reproduit le site historique', () => {
  for (const section of ['business', 'hours', 'prices', 'packCouple', 'faqs', 'pages', 'extras', 'eventTypes', 'privatisationIncludes', 'receptionIncludes', 'activitiesList', 'roomHours', 'security']) {
    it(section, () => {
      expect(norm(site[section])).toEqual(norm(expected[section]))
    })
  }

  it('rooms (id, name, price, features)', () => {
    const core = site.rooms.map(({ id, name, price, features }) => ({ id, name, price, features }))
    expect(norm(core)).toEqual(norm(expected.rooms))
  })

  it('rooms porte aussi quantity et photoKeys', () => {
    for (const room of site.rooms) {
      expect(room.quantity).toBe(1)
      expect(room.photoKeys).toEqual([])
    }
  })

  it('expose photos, photoSlots et texts', () => {
    expect(site.photos).toEqual(seed.photos)
    expect(site.photoSlots).toEqual({})
    expect(site.texts).toEqual({})
  })

  it('phoneHref ne garde que les chiffres et le +', () => {
    expect(site.business.phoneHref).toBe('tel:+261342141031')
  })
})

describe('buildSite avec un contenu modifié', () => {
  it('un prix de réception modifié se propage à prices et à la FAQ', () => {
    const content = clone(seed)
    content.prices.find((p) => p.key === 'reception_jour').amount = 175000
    const built = buildSite(content)
    expect(built.prices.reception.perDay).toBe(175000)
    const answer = built.faqs.find((f) => f.q.includes('réception événementielle')).a
    expect(answer).toContain('175')
    expect(answer).not.toContain('150')
  })

  it('les prix de chambre alimentent la description de /chambres', () => {
    const content = clone(seed)
    content.rooms[0].price = 40000
    const description = buildSite(content).pages.find((p) => p.path === '/chambres').description
    expect(norm(description)).toContain('De 40 000 Ar à 60 000 Ar la nuit')
  })

  it('faqs vides et rooms vides ne lèvent pas', () => {
    const content = clone(seed)
    content.faqs = []
    content.rooms = []
    const built = buildSite(content)
    expect(built.faqs).toEqual([])
    expect(built.rooms).toEqual([])
  })

  it('une variable inconnue dans une FAQ fait lever en nommant la variable', () => {
    const content = clone(seed)
    content.faqs[0].answer = 'Prix : {{prix.recption}}'
    expect(() => buildSite(content)).toThrow('prix.recption')
  })

  it('interpole les textes', () => {
    const content = clone(seed)
    content.texts = { 'accueil.titre': 'Dès {{prix.plat_du_jour}}' }
    expect(norm(buildSite(content).texts['accueil.titre'])).toBe('Dès 10 000 Ar')
  })

  it('une variable inconnue dans un texte ou une page fait lever', () => {
    const withText = clone(seed)
    withText.texts = { a: '{{nope}}' }
    expect(() => buildSite(withText)).toThrow('nope')
    const withPage = clone(seed)
    withPage.pages[0].description = '{{nada}}'
    expect(() => buildSite(withPage)).toThrow('nada')
  })
})
