import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { imagetools } from 'vite-imagetools'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { SITE_URL, business, pages, prices, rooms } from './src/data/site.js'

const buildSitemap = () => {
  const today = new Date().toISOString().slice(0, 10)
  const urls = pages
    .filter((p) => p.priority >= 0.5)
    .map(
      (p) => `  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <priority>${p.priority.toFixed(1)}</priority>
  </url>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

const buildRobots = () => `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`

const ar = (n) => `${n.toLocaleString('fr-FR').replace(/\s/g, ' ')} Ar`

// Résumé factuel pour les assistants IA (llms.txt).
const buildLlms = () => `# ${business.name}

> ${business.tagline}. Services événementiels à ${business.address.street}, ${business.address.city} ${business.address.postalCode}, ${business.address.country}.

Contact : ${business.phone} (WhatsApp) · ${business.email} · Facebook : ${business.facebookUrl}

## Offres
- Privatisation (piscine, grande salle, karaoké et dancing, baby-foot, jeux vidéo, simulateur de course, water gun, jeux de société) : ${ar(prices.privatisation.jour)} la journée (8h30-18h), ${ar(prices.privatisation.nuit)} la nuitée (18h-9h).
- Réception événementielle : ${ar(prices.reception.perDay)} par jour, ${prices.reception.maxGuests} personnes maximum.
${rooms.map((r) => `- ${r.name} : ${ar(r.price)} la nuit`).join('\n')}
- Restauration sur commande : plat du jour ${ar(prices.meals.platDuJour)}, plat complet ${ar(prices.meals.platComplet)}.

## Pages
${pages
  .filter((p) => p.priority >= 0.5)
  .map((p) => `- [${p.title}](${SITE_URL}${p.path}): ${p.description}`)
  .join('\n')}
`

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), imagetools()],
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    // vite-react-ssg précharge toutes les variantes d'image du manifeste (des dizaines de Mo) :
    // on les retire, le navigateur choisit lui-même la bonne via srcset.
    onPageRendered(_route, html) {
      return html.replace(/<link rel="preload" as="image"[^>]*>/g, '')
    },
    onFinished() {
      const out = resolve('dist')
      mkdirSync(out, { recursive: true })
      writeFileSync(resolve(out, 'sitemap.xml'), buildSitemap())
      writeFileSync(resolve(out, 'robots.txt'), buildRobots())
      writeFileSync(resolve(out, 'llms.txt'), buildLlms())
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js', 'scripts/**/*.test.js'],
  },
})
