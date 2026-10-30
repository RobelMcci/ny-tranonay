import { describe, expect, it } from 'vitest'
import { safeJsonLd } from './json-ld.js'

const hostile = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Q </script><script>alert(1)</script> ?', acceptedAnswer: { text: 'A <!-- commentaire --> & </SCRIPT >' } },
        { '@type': 'Question', name: 'Séparateurs \u2028 et \u2029', acceptedAnswer: { text: 'a > b' } },
      ],
    },
  ],
}

describe('safeJsonLd', () => {
  it('ne contient aucun caractère capable de fermer le bloc <script> ou d’ouvrir un commentaire HTML', () => {
    const out = safeJsonLd(hostile)
    expect(out).not.toMatch(/[<>&\u2028\u2029]/)
    expect(out.toLowerCase()).not.toContain('</script')
    expect(out).not.toContain('<!--')
    expect(out).toContain('\\u003c/script\\u003e')
    expect(out).toContain('\\u0026')
    expect(out).toContain('\\u2028')
    expect(out).toContain('\\u2029')
  })

  it('reste un JSON valide qui redonne exactement le même objet', () => {
    expect(JSON.parse(safeJsonLd(hostile))).toEqual(hostile)
  })

  it('un objet sans caractère sensible donne la même chaîne que JSON.stringify', () => {
    const plain = { '@type': 'WebSite', name: 'Tranonay', url: 'https://ny-tranonay.netlify.app/' }
    expect(safeJsonLd(plain)).toBe(JSON.stringify(plain))
  })
})
