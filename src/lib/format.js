export const formatAr = (amount) => `${Math.round(amount).toLocaleString('fr-FR')} Ar`

export const formatDateFr = (isoDate) => {
  if (!isoDate) return ''
  const date = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
}
