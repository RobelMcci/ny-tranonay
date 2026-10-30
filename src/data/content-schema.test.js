import { describe, expect, it } from 'vitest'
import { validateContent } from './content-schema.js'
import seed from './content.seed.json'

const PRICE_KEYS = [
  'privatisation_jour',
  'privatisation_nuit',
  'reception_jour',
  'reception_max_invites',
  'plat_du_jour',
  'plat_complet',
  'pack_couple',
]

const settingKeys = [
  'name', 'tagline', 'phone', 'whatsappNumber', 'email', 'facebookUrl', 'messengerUrl', 'facebookFollowers',
  'street', 'city', 'postalCode', 'country', 'countryCode', 'latitude', 'longitude',
  'openHour', 'closeHour', 'hoursLabel', 'roomCheckIn', 'roomCheckOut',
  'securitySummary', 'securityPartnerName', 'securityPartnerUrl',
]

const numericSettings = ['facebookFollowers', 'latitude', 'longitude', 'openHour', 'closeHour']

function makeValid() {
  const settings = Object.fromEntries(settingKeys.map((k) => [k, numericSettings.includes(k) ? 1 : 'x']))
  return {
    version: null,
    settings,
    prices: PRICE_KEYS.map((key) => ({
      key,
      label: `Libellé ${key}`,
      amount: 1000,
      unit: key === 'reception_max_invites' ? 'personnes' : 'ar',
    })),
    rooms: [{ id: 'double', name: 'Chambre double', price: 45000, features: ['Wifi'], photoKeys: [], quantity: 1 }],
    lists: {
      inclus_privatisation: ['Piscine'],
      inclus_reception: ['Salle'],
      extras: ['Barbecue'],
      activites: ['Baby-foot'],
      pack_couple: ['Chambre'],
      types_evenement: ['Autre'],
    },
    faqs: [{ question: 'Q ?', answer: 'R.' }],
    pages: [{ path: '/', title: 'T', description: 'D', priority: 1, navLabel: null }],
    photos: [
      { key: 'facade', file: 'image15', storagePath: null, alt: 'Façade', category: 'Espace', width: 10, height: 10, galleryPosition: 0 },
    ],
    photoSlots: {},
    texts: {},
  }
}

describe('validateContent', () => {
  it('renvoie des erreurs pour un objet vide', () => {
    expect(validateContent({}).length).toBeGreaterThan(0)
  })

  it('renvoie des erreurs pour une valeur qui n’est pas un objet', () => {
    expect(validateContent(null).length).toBeGreaterThan(0)
    expect(validateContent('x').length).toBeGreaterThan(0)
    expect(validateContent([]).length).toBeGreaterThan(0)
  })

  it('accepte un contenu minimal valide', () => {
    expect(validateContent(makeValid())).toEqual([])
  })

  it('tolère des clés supplémentaires dans lists', () => {
    const c = makeValid()
    c.lists.autre_liste = ['a']
    expect(validateContent(c)).toEqual([])
  })

  it('signale un montant négatif avec son chemin', () => {
    const c = makeValid()
    c.prices[2].amount = -1
    const errors = validateContent(c)
    expect(errors.some((e) => e.includes('prices[2].amount'))).toBe(true)
  })

  it('signale un montant décimal ou non numérique', () => {
    const c = makeValid()
    c.prices[0].amount = 10.5
    c.prices[1].amount = '100'
    const errors = validateContent(c)
    expect(errors.some((e) => e.includes('prices[0].amount'))).toBe(true)
    expect(errors.some((e) => e.includes('prices[1].amount'))).toBe(true)
  })

  it('signale une clé de prix manquante en la nommant', () => {
    const c = makeValid()
    c.prices = c.prices.filter((p) => p.key !== 'plat_complet')
    const errors = validateContent(c)
    expect(errors.some((e) => e.includes('plat_complet'))).toBe(true)
  })

  it('signale une unité invalide', () => {
    const c = makeValid()
    c.prices[0].unit = 'euros'
    expect(validateContent(c).some((e) => e.includes('prices[0].unit'))).toBe(true)
  })

  it('signale un prix de chambre invalide', () => {
    const c = makeValid()
    c.rooms[0].price = -5
    expect(validateContent(c).some((e) => e.includes('rooms[0].price'))).toBe(true)
  })

  it('signale une photo sans alt', () => {
    const c = makeValid()
    c.photos[0].alt = '  '
    expect(validateContent(c).some((e) => e.includes('photos[0].alt'))).toBe(true)
  })

  it('signale une photo sans file ni storagePath', () => {
    const c = makeValid()
    c.photos[0].file = null
    c.photos[0].storagePath = null
    const errors = validateContent(c)
    expect(errors.some((e) => e.includes('photos[0]') && e.includes('storagePath'))).toBe(true)
  })

  it('accepte une photo avec storagePath seul', () => {
    const c = makeValid()
    c.photos[0].file = null
    c.photos[0].storagePath = 'cms/x.webp'
    expect(validateContent(c)).toEqual([])
  })

  it('signale une section de mauvais type', () => {
    const c = makeValid()
    c.faqs = 'non'
    c.lists.extras = 'non'
    const errors = validateContent(c)
    expect(errors.some((e) => e.includes('faqs'))).toBe(true)
    expect(errors.some((e) => e.includes('lists.extras'))).toBe(true)
  })

  it('signale un paramètre manquant', () => {
    const c = makeValid()
    delete c.settings.phone
    expect(validateContent(c).some((e) => e.includes('settings.phone'))).toBe(true)
  })
})

describe('seed', () => {
  it('content.seed.json respecte le contrat', () => {
    expect(validateContent(seed)).toEqual([])
  })
})
