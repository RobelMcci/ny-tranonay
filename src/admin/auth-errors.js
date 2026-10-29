/** Messages de connexion en français ; jamais de texte technique brut ni d'adresse e-mail. */
export function authErrorMessage(error) {
  const message = String(error?.message ?? '')
  const status = error?.status

  if (status === 429 || /rate limit|too many/i.test(message)) {
    return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'
  }
  if (/invalid login credentials/i.test(message)) {
    return 'Adresse e-mail ou mot de passe incorrect.'
  }
  if (/failed to fetch|networkerror|network request failed|load failed/i.test(message) || error instanceof TypeError) {
    return 'Connexion impossible. Vérifiez votre connexion internet puis réessayez.'
  }
  return 'Une erreur est survenue. Réessayez dans un instant.'
}
