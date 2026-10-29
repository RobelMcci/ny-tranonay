/**
 * Partenaire de sécurité à citer (« avec le renfort de … ») : seulement si le nom ET l'adresse sont renseignés.
 * @param {{ partnerName?: string, partnerUrl?: string } | undefined} security
 * @returns {{ name: string, url: string } | null}
 */
export function securityPartner(security) {
  const name = String(security?.partnerName ?? '').trim()
  const url = String(security?.partnerUrl ?? '').trim()
  return name && url ? { name, url } : null
}
