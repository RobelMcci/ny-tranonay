// Sérialisation d'un bloc JSON-LD destiné à être écrit tel quel dans <script type="application/ld+json">.
// react-helmet-async n'échappe pas le contenu des balises <script> : un texte venu de la base contenant « </script> »
// sortirait du bloc. Les caractères <, >, & et les séparateurs U+2028 / U+2029 (qui n'apparaissent que dans des chaînes
// JSON) sont donc écrits sous forme d'échappements \uXXXX, que JSON.parse relit à l'identique.

const LINE_SEPARATOR = String.fromCharCode(0x2028)
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029)
const UNSAFE = new RegExp(`[<>&${LINE_SEPARATOR}${PARAGRAPH_SEPARATOR}]`, 'g')
const hex = (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`

/**
 * @param {unknown} value Objet JSON-LD.
 * @returns {string} JSON valide sans <, >, &, U+2028 ni U+2029 bruts.
 */
export function safeJsonLd(value) {
  return JSON.stringify(value).replace(UNSAFE, hex)
}
