// Contenu (seed) -> lignes à insérer dans chaque table. Pur : aucune lecture de fichier, aucun réseau.
// Réutilise les fonctions `…ToRow` de l'administration pour que l'import et l'écran d'édition écrivent les mêmes colonnes.
import { faqToRow } from '../../src/admin/faqs-map.js'
import { pageToRow } from '../../src/admin/pages-map.js'
import { photoToRow } from '../../src/admin/photos-map.js'
import { roomToRow } from '../../src/admin/rooms-map.js'
import { settingsToRow } from '../../src/admin/settings-map.js'

/**
 * @param {import('../../src/data/content-schema.js').Content} content
 * @returns {Record<string, object[]>} table -> lignes (snake_case). `list_items` et `faqs` n'ont pas d'`id`
 *   (colonne `GENERATED ALWAYS`) ; `photo_slots` et `texts` ne contiennent que des surcharges, donc rien à importer.
 */
export function seedRows(content) {
  return {
    settings: [settingsToRow(content.settings)],
    prices: content.prices.map(({ key, label, amount, unit }) => ({ key, label, amount, unit })),
    photos: content.photos.map((photo) => photoToRow({ ...photo, visible: true })),
    rooms: content.rooms.map((room, position) => roomToRow({ ...room, position, visible: true })),
    pages_seo: content.pages.map((page) => pageToRow(page)),
    list_items: Object.entries(content.lists).flatMap(([listKey, labels]) =>
      labels.map((label, position) => ({ list_key: listKey, label, position, visible: true })),
    ),
    faqs: content.faqs.map((faq, position) => faqToRow({ question: faq.question, answer: faq.answer, position, visible: true })),
    photo_slots: [],
    texts: [],
  }
}
