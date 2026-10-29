import { describe, expect, it } from 'vitest'
import seed from '../data/content.seed.json'
import { SECTION_TITLES, diffContent, groupChanges, modificationsLabel } from './diff.js'

const clone = () => structuredClone(seed)
const norm = (s) => s.replace(/\s/g, ' ')

describe('diffContent', () => {
  it('renvoie [] pour des contenus identiques', () => {
    expect(diffContent(clone(), clone())).toEqual([])
  })

  it('ignore la version', () => {
    const after = clone()
    after.version = 'abc-123'
    expect(diffContent(clone(), after)).toEqual([])
  })

  it('détecte un prix modifié, formaté en Ar', () => {
    const after = clone()
    after.prices.find((p) => p.key === 'reception_jour').amount = 175000
    const changes = diffContent(clone(), after)
    expect(changes).toHaveLength(1)
    const [change] = changes
    expect(change.section).toBe('prices')
    expect(change.kind).toBe('changed')
    expect(change.label).toBe('Tarif — Réception événementielle, par jour')
    expect(norm(change.before)).toBe('150 000 Ar')
    expect(norm(change.after)).toBe('175 000 Ar')
  })

  it('affiche un nombre simple pour les personnes', () => {
    const after = clone()
    after.prices.find((p) => p.key === 'reception_max_invites').amount = 80
    const [change] = diffContent(clone(), after)
    expect(change).toMatchObject({ section: 'prices', kind: 'changed', before: '50', after: '80' })
  })

  it('détecte une FAQ ajoutée', () => {
    const after = clone()
    after.faqs.push({ question: 'Peut-on venir avec des enfants ?', answer: 'Oui.' })
    expect(diffContent(clone(), after)).toEqual([
      { section: 'faqs', label: 'FAQ — Peut-on venir avec des enfants ?', kind: 'added', after: 'Oui.' },
    ])
  })

  it('détecte une FAQ retirée', () => {
    const after = clone()
    const [removed] = after.faqs.splice(0, 1)
    const changes = diffContent(clone(), after)
    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({ section: 'faqs', kind: 'removed', label: `FAQ — ${removed.question}` })
  })

  it('détecte la réponse modifiée d’une FAQ', () => {
    const after = clone()
    after.faqs[0].answer = 'Nouvelle réponse.'
    const changes = diffContent(clone(), after)
    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({ section: 'faqs', kind: 'changed', after: 'Nouvelle réponse.' })
  })

  it('détecte un réordonnancement de FAQ en un seul changement', () => {
    const after = clone()
    after.faqs.reverse()
    const changes = diffContent(clone(), after)
    expect(changes).toEqual([{ section: 'faqs', label: 'FAQ — ordre des questions', kind: 'changed' }])
  })

  it('détecte une chambre retirée', () => {
    const after = clone()
    const [room] = after.rooms.splice(0, 1)
    const changes = diffContent(clone(), after)
    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({ section: 'rooms', kind: 'removed', label: `Chambre — ${room.name}` })
  })

  it('détecte le prix modifié d’une chambre', () => {
    const after = clone()
    after.rooms[0].price = 50000
    const [change] = diffContent(clone(), after)
    expect(change.section).toBe('rooms')
    expect(change.kind).toBe('changed')
    expect(change.label).toBe(`Chambre — ${seed.rooms[0].name} : prix`)
    expect(norm(change.before)).toBe('45 000 Ar')
    expect(norm(change.after)).toBe('50 000 Ar')
  })

  it('détecte un changement d’ordre des chambres', () => {
    const after = clone()
    after.rooms.reverse()
    expect(diffContent(clone(), after)).toEqual([{ section: 'rooms', label: 'Ordre des chambres', kind: 'changed' }])
  })

  it('détecte un réordonnancement de liste en un seul changement', () => {
    const after = clone()
    after.lists.extras.reverse()
    const changes = diffContent(clone(), after)
    expect(changes).toEqual([{ section: 'lists', label: 'Extras — ordre modifié', kind: 'changed' }])
  })

  it('détecte les éléments ajoutés et retirés d’une liste', () => {
    const after = clone()
    const removed = after.lists.activites.shift()
    after.lists.activites.push('Pétanque')
    const changes = diffContent(clone(), after)
    expect(changes).toEqual(
      expect.arrayContaining([
        { section: 'lists', label: 'Activités', kind: 'removed', before: removed },
        { section: 'lists', label: 'Activités', kind: 'added', after: 'Pétanque' },
      ]),
    )
    expect(changes).toHaveLength(2)
  })

  it('détecte un réglage modifié avec un libellé lisible', () => {
    const after = clone()
    after.settings.phone = '+261 34 00 000 00'
    expect(diffContent(clone(), after)).toEqual([
      { section: 'settings', label: 'Contact — Téléphone', kind: 'changed', before: seed.settings.phone, after: '+261 34 00 000 00' },
    ])
  })

  it('détecte une page modifiée par champ', () => {
    const after = clone()
    after.pages[0].title = 'Autre titre'
    const changes = diffContent(clone(), after)
    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({ section: 'pages', kind: 'changed', label: `Page ${seed.pages[0].path} — titre`, after: 'Autre titre' })
  })

  it('détecte une photo ajoutée, retirée et un texte alternatif modifié', () => {
    const after = clone()
    after.photos[0].alt = 'Nouvelle description'
    const removed = after.photos.pop()
    after.photos.push({ ...removed, key: 'nouvelle' })
    const changes = diffContent(clone(), after)
    expect(changes.map((c) => c.kind).sort()).toEqual(['added', 'changed', 'removed'])
    expect(changes.every((c) => c.section === 'photos')).toBe(true)
  })

  it('détecte un emplacement photo et un texte surchargés puis rétablis', () => {
    const after = clone()
    after.photoSlots = { 'hero.1': 'piscine' }
    after.texts = { 'accueil.hero.titre': 'Mon titre' }
    const added = diffContent(clone(), after)
    expect(added).toHaveLength(2)
    expect(added.find((c) => c.section === 'photoSlots')).toMatchObject({
      kind: 'added',
      label: 'Emplacement photo — Bandeau d’accueil, 1re photo (jour)',
      after: seed.photos.find((p) => p.key === 'piscine').alt,
    })
    expect(added.find((c) => c.section === 'texts')).toMatchObject({
      kind: 'added',
      label: 'Texte — Accueil : Titre principal',
      after: 'Mon titre',
    })
    const removed = diffContent(after, clone())
    expect(removed.map((c) => c.kind)).toEqual(['removed', 'removed'])
  })

  it('montre le texte alternatif de la photo plutôt que sa clé dans le libellé', () => {
    const after = clone()
    after.photos.find((p) => p.key === 'escalier').category = 'Autre'
    const [change] = diffContent(clone(), after)
    const alt = seed.photos.find((p) => p.key === 'escalier').alt
    expect(alt.length).toBeGreaterThan(60)
    expect(change.label).toBe(`Photo — ${alt.slice(0, 60)}… : catégorie`)
  })

  it('garde un texte alternatif court en entier et la clé quand il est vide', () => {
    const after = clone()
    const short = after.photos.find((p) => p.key === 'piscine')
    short.alt = 'Piscine de nuit'
    const [changed] = diffContent(clone(), after)
    expect(changed.label).toBe('Photo — Piscine de nuit : texte alternatif')
    short.alt = ''
    const [empty] = diffContent(clone(), after)
    expect(empty.label).toBe('Photo — piscine : texte alternatif')
  })

  it('utilise le texte alternatif pour une photo ajoutée ou retirée', () => {
    const after = clone()
    after.photos.push({ ...after.photos[0], key: 'nouvelle', alt: 'Nouvelle vue du jardin' })
    const removed = after.photos.splice(1, 1)[0]
    const changes = diffContent(clone(), after)
    expect(changes.find((c) => c.kind === 'added').label).toBe('Photo — Nouvelle vue du jardin')
    const removedLabel = changes.find((c) => c.kind === 'removed').label
    expect(removedLabel.startsWith('Photo — ')).toBe(true)
    expect(removedLabel).not.toContain(removed.key)
  })

  it('montre le texte alternatif (avant et après) pour les emplacements photo, la clé si la photo est inconnue', () => {
    const before = clone()
    before.photoSlots = { 'hero.1': 'piscine' }
    const after = clone()
    after.photoSlots = { 'hero.1': 'photo-inconnue' }
    const [change] = diffContent(before, after)
    expect(change.before).toBe(seed.photos.find((p) => p.key === 'piscine').alt)
    expect(change.after).toBe('photo-inconnue')
  })

  it('utilise la clé quand l’emplacement est inconnu', () => {
    const after = clone()
    after.texts = { 'inconnu.cle': 'x' }
    expect(diffContent(clone(), after)[0].label).toBe('Texte — inconnu.cle')
  })

  it('tronque les textes longs', () => {
    const after = clone()
    after.faqs[0].answer = 'a'.repeat(300)
    const [change] = diffContent(clone(), after)
    expect(change.after.length).toBeLessThanOrEqual(121)
    expect(change.after.endsWith('…')).toBe(true)
  })

  it('traite tout comme ajouté quand before vaut null', () => {
    const changes = diffContent(null, clone())
    expect(changes.length).toBeGreaterThan(0)
    expect(changes.every((c) => c.kind === 'added')).toBe(true)
    const sections = new Set(changes.map((c) => c.section))
    for (const s of ['settings', 'prices', 'rooms', 'lists', 'faqs', 'pages', 'photos']) expect(sections.has(s)).toBe(true)
  })

  it('ne plante pas quand settings vaut null', () => {
    const empty = clone()
    empty.settings = null
    expect(() => diffContent(empty, clone())).not.toThrow()
    expect(() => diffContent(clone(), empty)).not.toThrow()
    expect(() => diffContent(null, empty)).not.toThrow()
    expect(diffContent(empty, clone()).every((c) => c.kind === 'added')).toBe(true)
    expect(diffContent(clone(), empty).every((c) => c.kind === 'removed')).toBe(true)
  })

  it('ne plante pas sur un brouillon vide ou incomplet', () => {
    expect(() => diffContent(clone(), {})).not.toThrow()
    expect(() => diffContent(null, { settings: null })).not.toThrow()
  })

  it('donne toujours un libellé non vide', () => {
    const after = clone()
    after.settings.city = 'Autre'
    after.prices[0].amount = 1
    after.rooms.reverse()
    after.rooms[0].features = ['x']
    after.lists.extras = ['a']
    after.lists.nouvelle_liste = ['a']
    after.faqs[0].answer = 'z'
    after.pages[0].priority = 0.1
    after.photos[0].category = 'Autre'
    after.photoSlots = { 'hero.1': 'piscine' }
    after.texts = { 'accueil.hero.titre': 'T' }
    for (const before of [clone(), null]) {
      for (const change of diffContent(before, after)) {
        expect(typeof change.label).toBe('string')
        expect(change.label.trim()).not.toBe('')
      }
    }
  })
})

describe('modificationsLabel', () => {
  it('formule le cas sans modification', () => {
    expect(modificationsLabel(0, true)).toBe('Aucune modification à publier')
    expect(modificationsLabel(0, false)).toBe('Aucune version publiée pour l’instant : aucune modification à publier')
  })
  it('accorde le singulier', () => {
    expect(modificationsLabel(1, true)).toBe('1 modification non publiée')
  })
  it('accorde le pluriel', () => {
    expect(modificationsLabel(2, true)).toBe('2 modifications non publiées')
    expect(modificationsLabel(120, true)).toBe('120 modifications non publiées')
  })
  it('signale l’absence de version publiée', () => {
    expect(modificationsLabel(3, false)).toBe('Aucune version publiée pour l’instant : 3 modifications non publiées')
    expect(modificationsLabel(1, false)).toBe('Aucune version publiée pour l’instant : 1 modification non publiée')
  })
})

describe('groupChanges', () => {
  it('regroupe par section, dans l’ordre de l’écran, avec un titre français', () => {
    const after = clone()
    after.texts = { 'accueil.hero.titre': 'T' }
    after.faqs[0].answer = 'z'
    after.settings.city = 'Autre'
    after.prices[0].amount = 1
    const groups = groupChanges(diffContent(clone(), after))
    expect(groups.map((g) => g.section)).toEqual(['settings', 'prices', 'faqs', 'texts'])
    expect(groups.map((g) => g.title)).toEqual(['Informations', 'Tarifs', 'FAQ', 'Textes'])
    expect(groups.every((g) => g.changes.length > 0 && g.changes.every((c) => c.section === g.section))).toBe(true)
  })

  it('ne renvoie aucun groupe sans changement', () => {
    expect(groupChanges([])).toEqual([])
  })

  it('donne un titre à chaque section du contrat', () => {
    expect(SECTION_TITLES).toEqual({
      settings: 'Informations',
      prices: 'Tarifs',
      rooms: 'Chambres',
      lists: 'Listes',
      faqs: 'FAQ',
      pages: 'Pages (référencement)',
      photos: 'Photos',
      photoSlots: 'Emplacements de photos',
      texts: 'Textes',
    })
  })

  it('garde une section inconnue plutôt que de la perdre', () => {
    const groups = groupChanges([{ section: 'autre', label: 'x', kind: 'added', after: 'y' }])
    expect(groups).toEqual([{ section: 'autre', title: 'autre', changes: [{ section: 'autre', label: 'x', kind: 'added', after: 'y' }] }])
  })
})
