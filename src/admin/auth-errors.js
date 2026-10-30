/** Messages de connexion en français ; jamais de texte technique brut ni d'adresse e-mail. */
export function authErrorMessage(error) {
  const message = String(error?.message ?? '')
  const code = error?.code
  const status = error?.status

  if (status === 429 || code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || /rate limit|too many/i.test(message)) {
    return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'
  }
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
    return 'Adresse e-mail ou mot de passe incorrect.'
  }
  if (code === 'same_password' || /different from the old password/i.test(message)) {
    return "Le nouveau mot de passe doit être différent de l'ancien."
  }
  if (code === 'weak_password' || /password.*(weak|should contain|at least)/i.test(message)) {
    return 'Ce mot de passe est trop faible. Choisissez-en un plus long et plus varié.'
  }
  if (error?.name === 'AuthRetryableFetchError' || /failed to fetch|networkerror|network request failed|load failed/i.test(message)) {
    return 'Connexion impossible. Vérifiez votre connexion internet puis réessayez.'
  }
  return 'Une erreur est survenue. Réessayez dans un instant.'
}
