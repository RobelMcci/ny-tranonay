// Emplacements de texte modifiables depuis le tableau de bord. Le défaut est le texte actuel du site :
// une surcharge (content.texts) ne remplace le défaut que si elle est une chaîne non vide.
// Ce fichier ne doit importer aucun asset : il est partagé avec les scripts Node.
// Un défaut peut contenir des variables `{{...}}` (ex. `{{prix.reception_max_invites}}`) : `resolveText` les remplace.
import { interpolate } from '../lib/interpolate.js'

/**
 * @typedef {object} TextSlot
 * @property {string} key Clé stable, utilisée dans `content.texts`.
 * @property {'accueil'|'salle'|'privatisation'|'chambres'|'tarifs'|'contact'} page Page regroupant l'emplacement.
 * @property {string} label Libellé français affiché dans l'administration.
 * @property {string} default Texte actuel du site.
 * @property {boolean} multiline Vrai si le champ de saisie est un texte long.
 */

/** @type {TextSlot[]} */
export const textSlots = [
  {
    key: 'accueil.hero.eyebrow',
    page: 'accueil',
    label: 'Ligne au-dessus du titre',
    default: 'Ambohimasina · route du CUR Vontovorona · Antananarivo',
    multiline: false,
  },
  {
    key: 'accueil.hero.titre',
    page: 'accueil',
    label: 'Titre principal',
    default: 'Salle de réception, piscine et chambres à Antananarivo',
    multiline: false,
  },
  {
    key: 'accueil.hero.sous-titre',
    page: 'accueil',
    label: 'Sous-titre',
    default:
      'Anniversaires, réceptions et soirées : une grande salle dressée, une piscine privatisable, un cinéma en plein air et des chambres climatisées, sur un site surveillé.',
    multiline: true,
  },
  {
    key: 'accueil.offre.salle.titre',
    page: 'accueil',
    label: 'Offre salle — titre',
    default: 'Salle de réception',
    multiline: false,
  },
  {
    key: 'accueil.offre.salle.texte',
    page: 'accueil',
    label: 'Offre salle — texte',
    default: 'Salle dinatoire équipée, couverts, nappes, housses de chaise, décoration florale et sono : tout est prêt.',
    multiline: true,
  },
  {
    key: 'accueil.offre.privatisation.titre',
    page: 'accueil',
    label: 'Offre privatisation — titre',
    default: 'Privatisation & piscine',
    multiline: false,
  },
  {
    key: 'accueil.offre.privatisation.texte',
    page: 'accueil',
    label: 'Offre privatisation — texte',
    default:
      'Piscine, cinéma en plein air, karaoké, baby-foot, jeux vidéo et simulateur de course rien que pour votre groupe.',
    multiline: true,
  },
  {
    key: 'accueil.offre.chambres.titre',
    page: 'accueil',
    label: 'Offre chambres — titre',
    default: 'Chambres sur place',
    multiline: false,
  },
  {
    key: 'accueil.offre.chambres.texte',
    page: 'accueil',
    label: 'Offre chambres — texte',
    default: 'Chambres climatisées avec eau chaude, wifi et terrasse privée pour prolonger la fête.',
    multiline: true,
  },
  {
    key: 'salle.hero.titre',
    page: 'salle',
    label: 'Titre principal',
    default: 'Location de salle de réception à Antananarivo',
    multiline: false,
  },
  {
    key: 'salle.hero.intro',
    page: 'salle',
    label: 'Texte d’introduction',
    default:
      'Une grande salle lumineuse, déjà dressée : nappes, housses de chaise, décoration florale et sonorisation. Jusqu’à {{prix.reception_max_invites}} personnes, de 8h30 à 18h.',
    multiline: true,
  },
  {
    key: 'privatisation.hero.titre',
    page: 'privatisation',
    label: 'Titre principal',
    default: 'Privatisez la piscine et l’espace de loisirs à Antananarivo',
    multiline: false,
  },
  {
    key: 'privatisation.hero.intro',
    page: 'privatisation',
    label: 'Texte d’introduction',
    default:
      'Le temps d’une journée ou d’une nuit, Tranonay est à vous : piscine, karaoké et dancing, baby-foot, jeux vidéo, simulateur de course, water gun et jeux de société.',
    multiline: true,
  },
  {
    key: 'chambres.hero.titre',
    page: 'chambres',
    label: 'Titre principal',
    default: 'Chambres climatisées à Ambohimasina, route du CUR Vontovorona',
    multiline: false,
  },
  {
    key: 'chambres.hero.intro',
    page: 'chambres',
    label: 'Texte d’introduction',
    default:
      'Terminez la soirée sur place : chambres avec climatisation, eau chaude, wifi et terrasse privée. Check-in à partir de {{checkin}}, check-out à {{checkout}}.',
    multiline: true,
  },
  {
    key: 'tarifs.hero.titre',
    page: 'tarifs',
    label: 'Titre principal',
    default: 'Tarifs de Tranonay et devis en ligne',
    multiline: false,
  },
  {
    key: 'tarifs.hero.intro',
    page: 'tarifs',
    label: 'Texte d’introduction',
    default:
      'Tous nos prix en toute transparence, et un simulateur pour estimer votre événement en deux minutes, puis nous l’envoyer sur WhatsApp.',
    multiline: true,
  },
  {
    key: 'contact.hero.titre',
    page: 'contact',
    label: 'Titre principal',
    default: 'Contacter Tranonay, à Ambohimasina',
    multiline: false,
  },
  {
    key: 'contact.hero.intro',
    page: 'contact',
    label: 'Texte d’introduction',
    default: 'Un renseignement, une date à bloquer, une visite ? Écrivez-nous là où vous êtes le plus à l’aise.',
    multiline: true,
  },
]

const slotByKey = new Map(textSlots.map((slot) => [slot.key, slot]))

function lookup(key, texts) {
  const slot = slotByKey.get(key)
  if (!slot) throw new Error(`Emplacement de texte inconnu : ${key}`)
  if (texts && Object.hasOwn(texts, key)) {
    const override = texts[key]
    if (typeof override === 'string' && override !== '') return { value: override, fromDefault: false }
  }
  return { value: slot.default, fromDefault: true }
}

/**
 * Texte brut d'un emplacement : la surcharge si elle est une chaîne non vide, sinon le défaut (variables non résolues).
 * @param {string} key Clé d'un emplacement déclaré dans `textSlots`.
 * @param {Record<string, string>} [texts] Surcharges (clé → texte).
 * @returns {string}
 * @throws {Error} Si la clé n'est pas déclarée.
 */
export function getText(key, texts) {
  return lookup(key, texts).value
}

/**
 * Texte affichable d'un emplacement. Les surcharges sont déjà interpolées par `buildSite` : seul le défaut est
 * interpolé ici (jamais deux fois une même valeur). Une variable inconnue dans le défaut lève une erreur.
 * @param {string} key
 * @param {Record<string, string>} texts Surcharges déjà interpolées.
 * @param {Record<string, string>} vars Variables de texte (`buildVars`).
 * @returns {string}
 */
export function resolveText(key, texts, vars) {
  const { value, fromDefault } = lookup(key, texts)
  return fromDefault ? interpolate(value, vars) : value
}
