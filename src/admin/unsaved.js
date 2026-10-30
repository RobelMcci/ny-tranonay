// Garde de navigation des écrans d'administration : fonctions pures (testées sous Node).

const screenOf = (location) => String(location?.pathname ?? '').replace(/\/+$/, '') || '/'

/**
 * Faut-il demander confirmation avant cette navigation interne ? Oui si des modifications ne sont pas enregistrées et
 * que l'on change d'écran (une ancre, des paramètres ou une barre oblique finale ne changent pas d'écran).
 * @param {boolean} dirty
 * @param {{ pathname: string } | undefined} currentLocation
 * @param {{ pathname: string } | undefined} nextLocation
 * @returns {boolean}
 */
export function shouldBlock(dirty, currentLocation, nextLocation) {
  if (!dirty) return false
  if (!currentLocation || !nextLocation) return true
  return screenOf(currentLocation) !== screenOf(nextLocation)
}

/**
 * Indice du bouton à focaliser après Tab (ou Maj+Tab) dans un dialogue de `count` boutons : le focus y reste piégé.
 * @param {number} current indice du bouton focalisé (-1 : aucun)
 * @param {number} count
 * @param {boolean} backwards Maj+Tab
 */
export function nextFocusIndex(current, count, backwards) {
  if (current < 0) return backwards ? count - 1 : 0
  return backwards ? (current - 1 + count) % count : (current + 1) % count
}
