import { describe, expect, it } from 'vitest'
import seed from '../data/content.seed.json'
import { publishProblems } from './publish-problems.js'

const clone = (o) => JSON.parse(JSON.stringify(o))

describe('publishProblems', () => {
  it('le seed est publiable : aucun problème', () => {
    expect(publishProblems(clone(seed))).toEqual([])
  })

  it('aucune chambre visible : publiable', () => {
    expect(publishProblems({ ...clone(seed), rooms: [] })).toEqual([])
  })

  it('aucune FAQ visible : publiable', () => {
    expect(publishProblems({ ...clone(seed), faqs: [] })).toEqual([])
  })

  it('informations absentes (settings nul) : écran Informations', () => {
    const problems = publishProblems({ ...clone(seed), settings: null })
    expect(problems).toContain('Informations : aucune information enregistrée.')
    expect(problems).toHaveLength(1)
  })

  it('prix négatif : écran Tarifs, avec le nom du tarif', () => {
    const draft = clone(seed)
    const index = draft.prices.findIndex((price) => price.key === 'reception_jour')
    draft.prices[index].amount = -1
    const problems = publishProblems(draft)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/^Tarifs : /)
    expect(problems[0]).toContain(draft.prices[index].label)
    expect(problems[0]).toMatch(/montant/)
  })

  it('tarif obligatoire manquant : écran Tarifs, avec la clé', () => {
    const draft = clone(seed)
    draft.prices = draft.prices.filter((price) => price.key !== 'pack_couple')
    const problems = publishProblems(draft)
    expect(problems.some((problem) => problem.startsWith('Tarifs : ') && problem.includes('pack_couple'))).toBe(true)
  })

  it('variable inconnue dans une FAQ : écran FAQ, variable nommée', () => {
    const draft = clone(seed)
    draft.faqs[1].answer = 'Comptez {{prix.recption}} la journée.'
    const problems = publishProblems(draft)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/^FAQ : /)
    expect(problems[0]).toContain('{{prix.recption}}')
    expect(problems[0]).toContain('réponse')
  })

  it('variable inconnue dans le référencement et dans un texte : écrans Référencement et Textes', () => {
    const draft = clone(seed)
    draft.pages[0].title = 'Accueil {{inconnue}}'
    draft.texts = { 'accueil.hero.titre': 'Bienvenue {{tél}}' }
    const problems = publishProblems(draft)
    expect(problems).toHaveLength(2)
    expect(problems.find((problem) => problem.startsWith('Référencement : '))).toMatch(/\{\{inconnue\}\}.*titre.*« \/ »/)
    expect(problems.find((problem) => problem.startsWith('Textes : '))).toMatch(/\{\{tél\}\}.*Titre principal/)
  })

  it('photo sans texte alternatif : écran Photos', () => {
    const draft = clone(seed)
    draft.photos[0].alt = ' '
    const problems = publishProblems(draft)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/^Photos : /)
    expect(problems[0]).toContain(draft.photos[0].key)
  })

  it('brouillon absent ou illisible : un seul problème, jamais d’exception', () => {
    expect(publishProblems(null)).toEqual(['Brouillon illisible : rechargez la page.'])
    expect(publishProblems('nope')).toEqual(['Brouillon illisible : rechargez la page.'])
  })

  it('sections de mauvais type : nommées sans exception', () => {
    const problems = publishProblems({ ...clone(seed), faqs: 'x', pages: null })
    expect(problems.some((problem) => problem.startsWith('FAQ : '))).toBe(true)
    expect(problems.some((problem) => problem.startsWith('Référencement : '))).toBe(true)
  })
})
