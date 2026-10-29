// Ce qui empêcherait le site de se construire avec le brouillon : vérifié avant d'autoriser « Publier ».
// Fonction pure, sans entrée/sortie : mêmes contrôles que le build (validateContent, variables, buildSite).
import { buildSite } from '../data/build-site.js'
import { validateContent } from '../data/content-schema.js'
import { resolveText, textSlots } from '../data/text-slots.js'
import { buildVars, unknownTokens } from '../lib/interpolate.js'

/** Écran du tableau de bord à ouvrir pour corriger chaque section du contenu (libellés du menu). */
const SCREENS = {
  settings: 'Informations',
  prices: 'Tarifs',
  rooms: 'Chambres',
  lists: 'Listes',
  faqs: 'FAQ',
  pages: 'Référencement',
  photos: 'Photos',
  photoSlots: 'Photos',
  texts: 'Textes',
}

const FIELDS = {
  key: 'clé',
  label: 'libellé',
  amount: 'montant',
  unit: 'unité',
  id: 'identifiant',
  name: 'nom',
  price: 'prix',
  features: 'équipements',
  photoKeys: 'photos',
  quantity: 'quantité',
  question: 'question',
  answer: 'réponse',
  path: 'chemin',
  title: 'titre',
  description: 'description',
  priority: 'priorité',
  navLabel: 'libellé du menu',
  alt: 'texte alternatif',
  file: 'fichier',
  storagePath: 'fichier téléversé',
  category: 'catégorie',
  galleryPosition: 'position dans la galerie',
}

const MAX_EXCERPT = 50

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const excerpt = (value) => {
  const text = String(value ?? '').trim()
  return text.length > MAX_EXCERPT ? `${text.slice(0, MAX_EXCERPT - 1)}…` : text
}
const tokens = (names) => names.map((name) => `{{${name}}}`).join(', ')
const unknownLabel = (names) => (names.length > 1 ? `variables inconnues ${tokens(names)}` : `variable inconnue ${tokens(names)}`)

/** Nom lisible de l'élément `index` d'une section (« Réception événementielle, par jour », « question 2 »…). */
function itemName(draft, section, index) {
  const item = Array.isArray(draft[section]) ? draft[section][index] : undefined
  const pick = (...keys) => keys.map((key) => (isObject(item) && typeof item[key] === 'string' ? item[key].trim() : '')).find(Boolean)
  const fallback = {
    prices: `tarif n° ${index + 1}`,
    rooms: `chambre n° ${index + 1}`,
    faqs: `question n° ${index + 1}`,
    pages: `page n° ${index + 1}`,
    photos: `photo n° ${index + 1}`,
  }[section] ?? `élément n° ${index + 1}`
  const named = {
    prices: pick('label', 'key'),
    rooms: pick('name', 'id'),
    faqs: pick('question'),
    pages: pick('path'),
    photos: pick('key', 'alt'),
  }[section]
  return named ? `« ${excerpt(named)} »` : fallback
}

/** Message d'erreur de `validateContent` → phrase française avec l'écran à ouvrir. */
function describeValidationError(draft, error) {
  if (error === 'settings : objet attendu') return 'Informations : aucune information enregistrée.'
  if (error === 'contenu : objet attendu') return 'Brouillon illisible : rechargez la page.'

  const item = /^(\w+)\[(\d+)\](?:\.(\w+))? : (.*)$/.exec(error)
  if (item) {
    const [, section, index, field, detail] = item
    const screen = SCREENS[section] ?? section
    const where = field ? ` (${FIELDS[field] ?? field})` : ''
    return `${screen} : ${itemName(draft, section, Number(index))}${where} — ${detail}.`
  }

  const nested = /^(\w+)\.([^ ]+) : (.*)$/.exec(error)
  if (nested) {
    const [, section, key, detail] = nested
    return `${SCREENS[section] ?? section} : « ${key} » — ${detail}.`
  }

  const top = /^(\w+) : (.*)$/.exec(error)
  if (top) {
    const [, section, detail] = top
    return `${SCREENS[section] ?? section} : ${detail}.`
  }
  return `Contenu : ${error}.`
}

/** Variables inconnues dans les textes interpolés au build (FAQ, référencement, textes surchargés). */
function variableProblems(draft) {
  const problems = []
  const vars = buildVars({
    prices: Array.isArray(draft.prices) ? draft.prices.filter(isObject) : [],
    rooms: Array.isArray(draft.rooms) ? draft.rooms.filter(isObject) : [],
    settings: isObject(draft.settings) ? draft.settings : {},
  })
  const check = (screen, value, where) => {
    if (typeof value !== 'string') return
    const unknown = unknownTokens(value, vars)
    if (unknown.length > 0) problems.push(`${screen} : ${unknownLabel(unknown)} dans ${where}.`)
  }

  if (Array.isArray(draft.faqs)) {
    draft.faqs.forEach((faq, index) => {
      if (!isObject(faq)) return
      const name = itemName(draft, 'faqs', index)
      check('FAQ', faq.question, `la question ${name}`)
      check('FAQ', faq.answer, `la réponse à ${name}`)
    })
  }
  if (Array.isArray(draft.pages)) {
    draft.pages.forEach((page, index) => {
      if (!isObject(page)) return
      const name = itemName(draft, 'pages', index)
      check('Référencement', page.title, `le titre de la page ${name}`)
      check('Référencement', page.description, `la description de la page ${name}`)
    })
  }
  if (isObject(draft.texts)) {
    for (const [key, value] of Object.entries(draft.texts)) {
      const slot = textSlots.find((candidate) => candidate.key === key)
      check('Textes', value, `« ${slot?.label ?? key} »`)
    }
  }
  return problems
}

/**
 * Problèmes qui empêcheraient la construction du site avec ce brouillon, en français, chacun préfixé par l'écran à ouvrir
 * (« Informations : aucune information enregistrée. »). Tableau vide : le brouillon est publiable. Ne lève jamais.
 * @param {unknown} draft Brouillon (`draft_content()`).
 * @returns {string[]}
 */
export function publishProblems(draft) {
  if (!isObject(draft)) return ['Brouillon illisible : rechargez la page.']
  try {
    const problems = [...validateContent(draft).map((error) => describeValidationError(draft, error)), ...variableProblems(draft)]
    if (problems.length > 0) return [...new Set(problems)]

    // Filet de sécurité : la construction réelle des données du site, textes par défaut compris.
    const site = buildSite(draft)
    const vars = buildVars(draft)
    for (const slot of textSlots) resolveText(slot.key, site.texts, vars)
    return []
  } catch (error) {
    return [`Contenu : ${error?.message ?? String(error)}.`]
  }
}
