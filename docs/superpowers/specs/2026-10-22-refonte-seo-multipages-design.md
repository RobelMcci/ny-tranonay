# Tranonay — refonte SEO multi-pages (design)

Date : 2026-10-22 · Statut : validé par carte blanche du propriétaire

## Objectif

L'espace est lancé. Le site doit (1) refléter la réalité (données vérifiées), (2) bien se référencer en local
(Antananarivo, Ambohimasina, Vontovorona, « services événementiels »), (3) convertir en réservations
(WhatsApp, Messenger, téléphone, formulaire) et (4) offrir une expérience mémorable.

Contraintes : pas de nom de domaine propre pour l'instant (le site reste sur netlify.app, l'URL de base est
une constante unique à changer le jour venu) ; stack React + Vite + Tailwind + Framer Motion conservée ;
aucune donnée inventée (0 avis → pas de témoignages ni de note).

## Données vérifiées (source : page Facebook + README du propriétaire)

- Adresse : Ambohimasina — route vers CUR Vontovorona, Antananarivo 101, Madagascar (orthographe **Vontovorona**).
- Tél./WhatsApp : +261 34 21 410 31 · Email : tranonay4@gmail.com · Messenger : « Tranonay » · Catégorie : Services événementiels.
- Facebook : https://www.facebook.com/profile.php?id=61588385663321
- Tarifs : privatisation Tafir 200 000 Ar (journée 8h30–18h) / 200 000 Ar (nuitée 18h–9h) ; réception événementielle
  150 000 Ar/jour (8h30–18h, 50 pers.) ; chambres 45 000 / 50 000 / 55 000 / 60 000 Ar la nuit (check-in 10h, check-out 10h) ;
  plat du jour 10 000 Ar, plat complet 20 000 Ar (sur commande, nourriture extérieure autorisée, boissons sur place).
- Sécurité : gardiens propriétaires sur site + groupe Dirickx Guard (dirickx.mg), engagé récemment.

**Retirés tant que non confirmés** : horaires d'ouverture, « actuellement ouvert », 120 pers., 2000 m², 15+ activités,
parking, Instagram/TikTok, tarifs team building, coworking, photo booth, services partenaires, contact@nytranonay.mg.

## Architecture (approche B : multi-pages pré-rendu)

`vite-react-ssg` + `react-router-dom@6` : chaque route est rendue en HTML statique au build.

| Route | Rôle / mot-clé principal |
|---|---|
| `/` | Accueil — espace événementiel & loisirs Antananarivo |
| `/salle-reception-evenements` | Location salle & réception (mariage, anniversaire, EVG/EVJF…) |
| `/privatisation-piscine` | Privatisation Tafir : piscine, karaoké, jeux — journée ou nuit |
| `/chambres` | Chambres Ambohimasina / Vontovorona |
| `/tarifs-devis` | Tarifs + simulateur de devis |
| `/securite` | Un lieu surveillé (gardiens + Dirickx Guard) — fusionnée dans l'accueil si trop mince |
| `/contact` | Formulaire, carte, coordonnées |
| `/mentions-legales`, `/confidentialite` | Pages légales (contenu minimal factuel) |
| `*` | 404 stylée, `noindex` |

Source unique de vérité : `src/data/site.js` (contact, offres, chambres, FAQ, URL de base). Les pages, le JSON-LD,
le sitemap et le configurateur en dérivent : un prix changé une fois l'est partout.

## SEO

- Titre/description/canonical/OG/Twitter **par page** (`<Head>`), `lang="fr"`, `og:locale=fr_MG`... (`fr_FR` conservé si `fr_MG` non reconnu).
- JSON-LD : `EventVenue`+`LodgingBusiness`/`LocalBusiness` sur l'accueil (adresse réelle, sans `aggregateRating`),
  `Offer`s sur tarifs, `FAQPage` sur la FAQ, `BreadcrumbList` par page. Pas d'horaires ni de réseaux inexistants.
- `sitemap.xml` généré au build depuis les routes, `robots.txt`, `404` noindex, `_headers` (cache long sur assets hachés, sécurité).
- Images : WebP/AVIF multi-largeurs générés par script (sharp), `width`/`height`, `loading`, alt descriptifs réels.
- Perf : suppression de tsParticles (lib lourde) au profit d'un canvas léger pour la scène de nuit ; polices Inter
  en `preload` ; plus de vidéo manquante ni de poster Unsplash ; chargement différé des sections lourdes.
- GEO/IA : contenu factuel en HTML pré-rendu, `llms.txt` court.

## La surprise

1. **« Une journée à Tranonay »** — section scroll-pilotée : le ciel passe de l'aube à la nuit (8h30 → 18h → nuit)
   en suivant les vrais créneaux de privatisation ; piscine le jour, karaoké et étoiles/lucioles la nuit.
2. **Simulateur de devis instantané** — type d'événement, jour/nuit, invités, chambres, repas → estimation en Ar
   calculée avec les vrais tarifs + message WhatsApp/Messenger prérempli (mention « estimation, confirmée par l'équipe »).
   Logique pure testée (`src/lib/quote.js`, vitest).
3. **Carte d'invitation** — après le devis, génération d'une carte PNG (canvas) avec date, lieu et lien Maps,
   partageable (Web Share API / téléchargement) pour inviter ses amis.

## Autres améliorations

- Formulaire Netlify réparé (rendu pré-rendu → détecté ; honeypot ; vraie gestion d'erreur ; lien WhatsApp en repli).
- Barre d'action mobile collante (Appeler · WhatsApp · Messenger · Devis) ; bouton WhatsApp flottant conservé sur desktop.
- Section sécurité : gardiens sur place + Dirickx Guard avec lien vers dirickx.mg (texte seulement, sans logo tiers).
- Accessibilité : skip-link, focus visibles, `prefers-reduced-motion` respecté, contrastes AA, navigation clavier du menu et du lightbox.
- Footer : vrai lien Facebook, adresse, pages légales réelles ; emplacement « Avis » prêt pour de vrais avis (rien d'affiché à 0).
- Manifest PWA corrigé (nom, couleurs).

## Hors périmètre (plus tard)

Nom de domaine, Google Business Profile (action du propriétaire, guide fourni), version anglaise/malgache,
calendrier de disponibilités (nécessite un back-end), vrais témoignages.

## Test / vérification

`npm run build` (prérendu de toutes les routes) + `npm run lint` + tests vitest du simulateur + contrôle du HTML généré
(titres, JSON-LD valide, absence de données retirées) + rendu navigateur desktop/mobile.

## Addendum — phase 2 (même jour)

Informations reçues : coordonnées GPS (-18.945199, 47.431368), horaires 8h–21h, 21 nouvelles photos Facebook,
capture montrant 4 000+ abonnés, affiche « Pack couple 100 000 Ar ».

- Données : `hours`, `business.geo`, `packCouple` dans `site.js` ; JSON-LD enrichi (geo, openingHours, offre du pack) ; FAQ (horaires, pack).
- Simulateur : 4ᵉ formule « Pack couple » (testée).
- Design / motion : hero en trois ambiances (jour, crépuscule, nuit) avec zoom lent, titre révélé mot à mot (CSS),
  bandeaux défilants, compteurs animés, vagues animées, parallaxe, cartes inclinables, barre de progression de lecture,
  transition de page, pastille « Ouvert maintenant » (heure de Madagascar), carrousel des chambres, section cinéma en plein air,
  mosaïque d'activités, scène jour/nuit à 6 étapes avec lever de soleil final.
- Toutes les animations respectent `prefers-reduced-motion`.
- Performance : Lighthouse mobile 91–97 (SEO, accessibilité et bonnes pratiques à 100) ; l'accueil, très riche, est à 93 sous
  ralentissement réseau réel et 82–85 sous la simulation Lantern (artefact de l'hydratation sur localhost).
