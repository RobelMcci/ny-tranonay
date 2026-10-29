// FAQ : conversion ligne SQL ⇄ objet et validation de saisie. Fonctions pures, sans accès réseau.

export const MAX_QUESTION = 200
export const MAX_ANSWER = 3000

/**
 * @typedef {object} Faq
 * @property {number} [id] Absent tant que la question n'est pas enregistrée.
 * @property {string} question
 * @property {string} answer
 * @property {number} position
 * @property {boolean} visible
 */

/** @returns {Faq} */
export function faqFromRow(row) {
  return { id: row.id, question: row.question, answer: row.answer, position: row.position, visible: row.visible }
}

/** @param {Faq} faq */
export function faqToRow(faq) {
  const row = { question: faq.question, answer: faq.answer, position: faq.position, visible: faq.visible }
  return faq.id == null ? row : { id: faq.id, ...row }
}

const fr = (n) => n.toLocaleString('fr-FR').replace(/[\u00A0\u202F]/g, ' ')

/**
 * Contrôle la saisie d'une FAQ (les variables `{{…}}` sont vérifiées à part, avec `checkTokens`).
 * @param {{ question?: string, answer?: string }} faq
 * @returns {{ question?: string, answer?: string }} Un message par champ en erreur.
 */
export function validateFaq(faq) {
  const errors = {}
  const question = String(faq.question ?? '').trim()
  if (question === '') errors.question = 'La question est obligatoire.'
  else if (question.length > MAX_QUESTION) errors.question = `La question ne peut pas dépasser ${fr(MAX_QUESTION)} caractères.`
  const answer = String(faq.answer ?? '').trim()
  if (answer === '') errors.answer = 'La réponse est obligatoire.'
  else if (answer.length > MAX_ANSWER) errors.answer = `La réponse ne peut pas dépasser ${fr(MAX_ANSWER)} caractères.`
  return errors
}
