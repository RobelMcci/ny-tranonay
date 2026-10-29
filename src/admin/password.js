export const MIN_PASSWORD_LENGTH = 10

/** Valide un nouveau mot de passe ; renvoie un message français, ou null s'il est valide. */
export function validateNewPassword(password, confirm) {
  if (!password) return 'Saisissez un nouveau mot de passe.'
  if (password.length < MIN_PASSWORD_LENGTH) return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`
  if (password !== confirm) return 'Les deux mots de passe ne sont pas identiques.'
  return null
}
