import { describe, expect, it } from 'vitest'
import seed from '../data/content.seed.json'
import { faqFromRow, faqToRow, MAX_ANSWER, MAX_QUESTION, validateFaq } from './faqs-map.js'

describe('faqFromRow / faqToRow', () => {
  it('fait l’aller-retour sur les FAQ du seed', () => {
    seed.faqs.forEach((faq, index) => {
      const row = { id: index + 1, question: faq.question, answer: faq.answer, position: index, visible: index % 2 === 0 }
      const mapped = faqFromRow(row)
      expect(mapped).toEqual({ id: index + 1, question: faq.question, answer: faq.answer, position: index, visible: index % 2 === 0 })
      expect(faqToRow(mapped)).toEqual(row)
    })
  })

  it('une FAQ sans identifiant donne une ligne sans id', () => {
    expect(faqToRow({ question: 'Q', answer: 'R', position: 3, visible: true })).toEqual({ question: 'Q', answer: 'R', position: 3, visible: true })
  })
})

describe('validateFaq', () => {
  const ok = { question: 'Question ?', answer: 'Réponse.' }

  it('accepte une FAQ valide', () => {
    expect(validateFaq(ok)).toEqual({})
    for (const faq of seed.faqs) expect(validateFaq(faq)).toEqual({})
  })

  it('question et réponse obligatoires (espaces seuls refusés)', () => {
    expect(validateFaq({ question: '  ', answer: '\n' })).toEqual({ question: expect.any(String), answer: expect.any(String) })
    expect(validateFaq({})).toEqual({ question: expect.any(String), answer: expect.any(String) })
  })

  it('bornes : 200 caractères pour la question, 3000 pour la réponse', () => {
    expect(validateFaq({ question: 'q'.repeat(MAX_QUESTION), answer: 'a'.repeat(MAX_ANSWER) })).toEqual({})
    const errors = validateFaq({ question: 'q'.repeat(MAX_QUESTION + 1), answer: 'a'.repeat(MAX_ANSWER + 1) })
    expect(errors.question).toContain('200')
    expect(errors.answer).toContain('3 000')
  })

  it('mesure sur le texte nettoyé', () => {
    expect(validateFaq({ question: ` ${'q'.repeat(MAX_QUESTION)} `, answer: 'a' })).toEqual({})
  })
})
