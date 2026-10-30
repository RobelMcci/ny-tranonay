import { describe, expect, it } from 'vitest'
import { faqSchema, graph } from './schema.js'

describe('faqSchema', () => {
  it('construit un FAQPage avec une question par entrée', () => {
    const node = faqSchema([{ q: 'Q ?', a: 'R.' }])
    expect(node).toEqual({
      '@type': 'FAQPage',
      mainEntity: [{ '@type': 'Question', name: 'Q ?', acceptedAnswer: { '@type': 'Answer', text: 'R.' } }],
    })
  })

  it('sans FAQ : null (pas de FAQPage vide)', () => {
    expect(faqSchema([])).toBeNull()
  })

  it('utilise la FAQ du site par défaut', () => {
    expect(faqSchema().mainEntity.length).toBeGreaterThan(0)
  })
})

describe('graph', () => {
  it('omet les nœuds absents (FAQPage sans question)', () => {
    expect(graph({ '@type': 'WebSite' }, faqSchema([]), { '@type': 'BreadcrumbList' })).toEqual({
      '@context': 'https://schema.org',
      '@graph': [{ '@type': 'WebSite' }, { '@type': 'BreadcrumbList' }],
    })
  })
})
