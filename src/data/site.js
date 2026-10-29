// Source unique de vérité : contact, offres, tarifs, FAQ, pages. Construite depuis l'instantané de contenu
// (src/data/content.snapshot.json, écrit par scripts/fetch-content.mjs avant build/dev/test).
// Ce fichier ne doit importer aucun asset : il est aussi lu par vite.config.js (sitemap, robots, llms.txt).
import snapshot from './content.snapshot.json'
import { buildSite } from './build-site.js'
import { buildVars } from '../lib/interpolate.js'
import { resolveText } from './text-slots.js'

// À changer le jour où le nom de domaine est acheté (une seule ligne).
export const SITE_URL = 'https://ny-tranonay.netlify.app'

const site = buildSite(snapshot)

/** Identifiant de l'instantané publié ('seed' si le build s'appuie sur le seed). */
export const contentVersion = snapshot.version ?? 'seed'

export const business = site.business
export const hours = site.hours
export const security = site.security
export const prices = site.prices
export const packCouple = site.packCouple
export const privatisationIncludes = site.privatisationIncludes
export const receptionIncludes = site.receptionIncludes
export const extras = site.extras
export const rooms = site.rooms
export const activitiesList = site.activitiesList
export const roomHours = site.roomHours
export const eventTypes = site.eventTypes
export const faqs = site.faqs
export const pages = site.pages
export const photos = site.photos
export const photoSlots = site.photoSlots
export const texts = site.texts

/** Texte modifiable d'un emplacement déclaré dans text-slots.js (surcharge publiée, sinon texte par défaut avec ses variables résolues). */
const textVars = buildVars(snapshot)
export const text = (key) => resolveText(key, texts, textVars)

const coords = `${business.geo.latitude},${business.geo.longitude}`
export const mapsEmbedUrl = `https://www.google.com/maps?q=${coords}&z=17&output=embed`
export const mapsDirectionsUrl = `https://www.google.com/maps/search/?api=1&query=${coords}`

export const whatsappLink = (message) =>
  `https://wa.me/${business.whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`

export const pageByPath = (path) => pages.find((p) => p.path === path)
export const absoluteUrl = (path = '/') => `${SITE_URL}${path === '/' ? '/' : path}`
