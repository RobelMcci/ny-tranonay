import { describe, expect, it } from 'vitest'
import { buildQuote, quoteToMessage, formatAr, emptyQuoteInput } from './quote.js'
import { prices, rooms } from '../data/site.js'

const base = emptyQuoteInput()

describe('buildQuote', () => {
  it('privatisation journée seule = 200 000 Ar', () => {
    const q = buildQuote({ ...base, formula: 'privatisation', slots: { jour: true, nuit: false } })
    expect(q.total).toBe(200000)
    expect(q.lines).toHaveLength(1)
  })

  it('privatisation journée + nuitée = 400 000 Ar', () => {
    const q = buildQuote({ ...base, formula: 'privatisation', slots: { jour: true, nuit: true } })
    expect(q.total).toBe(400000)
  })

  it('privatisation sans créneau coché = 0 et avertissement', () => {
    const q = buildQuote({ ...base, formula: 'privatisation', slots: { jour: false, nuit: false } })
    expect(q.total).toBe(0)
    expect(q.warnings.length).toBeGreaterThan(0)
  })

  it('réception = 150 000 Ar par jour', () => {
    const q = buildQuote({ ...base, formula: 'reception', receptionDays: 2, guests: 40 })
    expect(q.total).toBe(300000)
  })

  it('réception au-delà de 50 personnes → avertissement, prix inchangé', () => {
    const q = buildQuote({ ...base, formula: 'reception', guests: 80 })
    expect(q.total).toBe(150000)
    expect(q.warnings.join(' ')).toMatch(/50/)
  })

  it('chambres = prix × quantité × nuits', () => {
    const q = buildQuote({
      ...base,
      formula: 'sejour',
      nights: 2,
      rooms: { double: 2, twin: 1 },
    })
    // (2 × 45 000 + 1 × 55 000) × 2 nuits
    expect(q.total).toBe(290000)
  })

  it('les chambres s’ajoutent à une privatisation', () => {
    const q = buildQuote({
      ...base,
      formula: 'privatisation',
      slots: { jour: false, nuit: true },
      nights: 1,
      rooms: { 'double-privee': 1 },
    })
    expect(q.total).toBe(260000)
  })

  it('repas = prix par personne', () => {
    const q = buildQuote({
      ...base,
      formula: 'reception',
      meals: { platDuJour: 10, platComplet: 5 },
    })
    expect(q.total).toBe(150000 + 10 * 10000 + 5 * 20000)
  })

  it('pack couple = 100 000 Ar, multiplié par le nombre de packs', () => {
    expect(buildQuote({ ...base, formula: 'couple' }).total).toBe(100000)
    expect(buildQuote({ ...base, formula: 'couple', couplePacks: 3 }).total).toBe(300000)
  })

  it('ignore les quantités négatives ou invalides', () => {
    const q = buildQuote({ ...base, formula: 'sejour', nights: 1, rooms: { double: -3, twin: Number.NaN } })
    expect(q.total).toBe(0)
  })
})

describe('buildQuote avec un contenu injecté', () => {
  it('utilise les prix du contenu fourni (privatisation journée = 250 000 Ar)', () => {
    const content = { prices: { ...prices, privatisation: { jour: 250000, nuit: 250000 } }, rooms }
    const q = buildQuote({ ...base, formula: 'privatisation', slots: { jour: true, nuit: false } }, content)
    expect(q.total).toBe(250000)
  })

  it('utilise les chambres du contenu fourni (1 chambre à 70 000 Ar × 2 × 3 nuits = 420 000 Ar)', () => {
    const content = { prices, rooms: [{ id: 'suite', name: 'Suite', price: 70000 }] }
    const q = buildQuote({ ...base, formula: 'sejour', nights: 3, rooms: { suite: 2 } }, content)
    expect(q.total).toBe(420000)
  })

  it('ignore sans erreur une chambre demandée quand le contenu n’a aucune chambre', () => {
    const content = { prices, rooms: [] }
    const q = buildQuote(
      { ...base, formula: 'privatisation', slots: { jour: true, nuit: false }, rooms: { double: 2 } },
      content,
    )
    expect(q.total).toBe(200000)
    expect(q.lines).toHaveLength(1)
    expect(() => buildQuote({ ...base, formula: 'sejour', rooms: { double: 2 } }, content)).not.toThrow()
    expect(buildQuote({ ...base, formula: 'sejour', rooms: { double: 2 } }, content).total).toBe(0)
  })
})

describe('formatAr', () => {
  it('formate avec séparateur de milliers insécable', () => {
    expect(formatAr(200000).replace(/\s/g, ' ')).toBe('200 000 Ar')
  })
})

describe('quoteToMessage', () => {
  it('résume la demande et mentionne que le prix est une estimation', () => {
    const input = { ...base, formula: 'privatisation', slots: { jour: true, nuit: false }, eventType: 'Anniversaire', date: '2026-12-20', guests: 30, name: 'Hery' }
    const quote = buildQuote(input)
    const msg = quoteToMessage(input, quote)
    expect(msg).toMatch(/Hery/)
    expect(msg).toMatch(/Anniversaire/)
    expect(msg).toMatch(/20 décembre 2026/)
    expect(msg).toMatch(/200\s000 Ar/)
    expect(msg).toMatch(/estimation/i)
  })
})
