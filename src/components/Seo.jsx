import { Head } from 'vite-react-ssg'
import { absoluteUrl, business, pageByPath } from '../data/site.js'
import { safeJsonLd } from '../lib/json-ld.js'
import { breadcrumbSchema, graph, ogImage } from '../lib/schema.js'

/** Balises <head> d'une page : titre, description, canonical, Open Graph, JSON-LD. */
export default function Seo({ path, nodes = [], noindex = false }) {
  const page = pageByPath(path) ?? {
    title: 'Page introuvable | Tranonay',
    description: 'Cette page n’existe pas. Retrouvez la salle de réception, la piscine et les chambres de Tranonay.',
  }
  const url = absoluteUrl(path)
  const jsonLd = graph(...nodes, ...(noindex ? [] : [breadcrumbSchema(path)]))

  return (
    <Head>
      <title>{page.title}</title>
      <meta name="description" content={page.description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={business.name} />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:title" content={page.title} />
      <meta property="og:description" content={page.description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Piscine et jardin de Tranonay à Ambohimasina" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={page.title} />
      <meta name="twitter:description" content={page.description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Échappé : le contenu vient de la base et react-helmet-async écrit le script tel quel. */}
      {!noindex && <script type="application/ld+json">{safeJsonLd(jsonLd)}</script>}
    </Head>
  )
}
