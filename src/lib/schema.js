import { SITE_URL, absoluteUrl, business, faqs, hours, mapsDirectionsUrl, packCouple, pageByPath, rooms, prices, privatisationIncludes, receptionIncludes } from '../data/site.js'

const businessId = `${SITE_URL}/#business`

const mga = (amount) => Math.round(amount).toLocaleString('fr-FR').replace(/\s/g, ' ')

// Du prix de chambre le plus bas au prix de privatisation le plus haut.
const priceRange = () => {
  const low = rooms.length ? Math.min(...rooms.map((r) => r.price)) : Math.min(prices.privatisation.jour, prices.privatisation.nuit)
  const high = Math.max(prices.privatisation.jour, prices.privatisation.nuit)
  return `${mga(low)} – ${mga(high)} MGA`
}

export const ogImage = `${SITE_URL}/og-image.jpg`

// Données fournies par le propriétaire uniquement : pas d'avis ni de note inventés.
export const businessSchema = () => ({
  '@type': ['EventVenue', 'LodgingBusiness'],
  '@id': businessId,
  name: business.name,
  description: `${business.tagline}. Services événementiels à Ambohimasina, route vers le CUR Vontovorona.`,
  url: `${SITE_URL}/`,
  image: ogImage,
  logo: `${SITE_URL}/icon-512.png`,
  telephone: business.phone,
  email: business.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: business.address.street,
    addressLocality: business.address.city,
    postalCode: business.address.postalCode,
    addressCountry: business.address.countryCode,
  },
  geo: { '@type': 'GeoCoordinates', latitude: business.geo.latitude, longitude: business.geo.longitude },
  hasMap: mapsDirectionsUrl,
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hours.days,
      opens: `${String(hours.open).padStart(2, '0')}:00`,
      closes: `${String(hours.close).padStart(2, '0')}:00`,
    },
  ],
  priceRange: priceRange(),
  currenciesAccepted: 'MGA',
  sameAs: [business.facebookUrl],
  amenityFeature: [
    'Piscine',
    'Salle de réception',
    'Karaoké et dancing',
    'Baby-foot',
    'Jeux vidéo et simulateur de course',
    'Barbecue',
    'Cuisine équipée',
    'Chambres climatisées avec wifi',
    'Cinéma en plein air',
    'Trampoline et toboggan',
    'Gardiennage et surveillance',
  ].map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
})

export const websiteSchema = () => ({
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: business.name,
  inLanguage: 'fr',
  publisher: { '@id': businessId },
})

export const breadcrumbSchema = (path) => {
  const items = [{ name: 'Accueil', path: '/' }]
  if (path !== '/') items.push({ name: pageByPath(path)?.nav ?? pageByPath(path)?.title ?? 'Page', path })
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export const faqSchema = () => ({
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
})

const offer = (name, description, price) => ({
  '@type': 'Offer',
  priceCurrency: 'MGA',
  price: String(price),
  availability: 'https://schema.org/InStock',
  itemOffered: { '@type': 'Service', name, description, provider: { '@id': businessId } },
})

export const offersSchema = () => ({
  '@type': 'OfferCatalog',
  name: 'Tarifs Tranonay',
  itemListElement: [
    offer('Privatisation — journée (8h30-18h)', `Accès à : ${privatisationIncludes.join(', ')}.`, prices.privatisation.jour),
    offer('Privatisation — nuitée (18h-9h)', `Accès à : ${privatisationIncludes.join(', ')}.`, prices.privatisation.nuit),
    offer('Réception événementielle — par jour', `Jusqu'à ${prices.reception.maxGuests} personnes. ${receptionIncludes.join(', ')}.`, prices.reception.perDay),
    ...rooms.map((r) => offer(`${r.name} — par nuit`, r.features.join(', '), r.price)),
    offer(packCouple.name, `${packCouple.includes.join(', ')}.`, packCouple.price),
  ],
})

export const serviceSchema = (name, description, price) => ({
  '@type': 'Service',
  name,
  description,
  provider: { '@id': businessId },
  areaServed: { '@type': 'City', name: 'Antananarivo' },
  offers: { '@type': 'Offer', priceCurrency: 'MGA', price: String(price) },
})

export const graph =(...nodes) => ({ '@context': 'https://schema.org', '@graph': nodes })
