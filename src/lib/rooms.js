/**
 * Prix mini et maxi des chambres visibles.
 * @param {{ price: number }[]} rooms
 * @returns {{ min: number, max: number } | null} `null` quand il n'y a aucune chambre.
 */
export function roomPriceRange(rooms) {
  if (!rooms || rooms.length === 0) return null
  const prices = rooms.map((room) => room.price)
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

const NUMBER_WORDS = ['', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf']

/**
 * « Quatre types de chambre » d'après le nombre de chambres visibles (lettres de 1 à 9, chiffres au-delà).
 * @param {number} count
 * @param {{ pluralNoun?: boolean, adjective?: string }} [options]
 *   `pluralNoun` : « types de chambres » (sinon « types de chambre ») ; `adjective` : accordé au singulier ou au pluriel
 *   du nom (« climatisée » → « chambres climatisées »).
 * @returns {string | null} `null` sans chambre (la page garde alors sa phrase neutre).
 */
export function roomTypesLabel(count, { pluralNoun = false, adjective = '' } = {}) {
  if (!Number.isInteger(count) || count < 1) return null
  if (count === 1) return `Un type de chambre${adjective ? ` ${adjective}` : ''}`
  const number = count < NUMBER_WORDS.length ? NUMBER_WORDS[count] : String(count)
  const plural = pluralNoun ? 's' : ''
  return `${number} types de chambre${plural}${adjective ? ` ${adjective}${plural}` : ''}`
}

/**
 * Heure en tête d'un horaire saisi librement (« 10h le lendemain » → « 10h ») ; le texte entier s'il ne commence pas
 * par une heure (« midi »). Sert aux phrases courtes « check-in 10h, check-out 10h ».
 * @param {string | undefined} value
 * @returns {string}
 */
export function roomHourShort(value) {
  const text = String(value ?? '').trim()
  const match = /^\d{1,2}\s?h(?:\s?\d{2})?/i.exec(text)
  return match ? match[0] : text
}
