# Tranonay — site web

Site de Tranonay (salle de réception, privatisation avec piscine, chambres — Ambohimasina, Antananarivo).
En ligne : https://ny-tranonay.netlify.app/

## Technique

React + Vite + Tailwind + Framer Motion, **pré-rendu en HTML statique** avec `vite-react-ssg` (une page HTML complète par route :
c'est ce qui permet un bon référencement). Hébergé sur Netlify (config dans `netlify.toml`).

```bash
npm install
npm run dev      # développement
npm run build    # build + pré-rendu des pages + sitemap.xml, robots.txt, llms.txt dans dist/
npm run preview  # servir dist/ en local
npm test         # tests du simulateur de devis
npm run lint
npm run og       # régénère public/og-image.jpg (image de partage) depuis une photo
npm run icons    # régénère le logo (icon.svg) et les icônes PNG
```

### Où modifier quoi

| Je veux changer… | Fichier |
|---|---|
| Un prix, une chambre, un horaire, le téléphone, l'email, l'adresse, la FAQ | `src/data/site.js` (source unique : pages, simulateur, JSON-LD, sitemap et llms.txt s'en servent) |
| Le titre / la description Google d'une page | `pages` dans `src/data/site.js` |
| Les photos | déposer `imageNN.jpg` dans `src/assets/` puis la déclarer dans `src/lib/images.js` (texte alternatif + catégorie). Les sources non utilisées vivent dans `assets-source/` (hors build) |
| Le pack couple, les horaires, les coordonnées GPS | `src/data/site.js` |
| Le contenu d'une page | `src/pages/` |
| Le calcul du devis | `src/lib/quote.js` (testé dans `quote.test.js`) |

### Quand le nom de domaine sera acheté

1. Changer `SITE_URL` en haut de `src/data/site.js` (une seule ligne).
2. `npm run build` puis déployer : canonical, Open Graph, JSON-LD, sitemap et robots.txt sont régénérés.
3. Dans Netlify : *Domain management → Add a domain*, puis ajouter l'ancien lien netlify.app en redirection 301 vers le nouveau.
4. Déclarer le nouveau domaine dans Google Search Console et renvoyer le sitemap.

### Formulaire de contact

Netlify Forms (formulaire `reservation`). Pour recevoir un email à chaque demande :
Netlify → *Forms → Form notifications → Add notification → Email*, avec tranonay4@gmail.com.

Voir aussi `docs/guide-referencement.md` (Google, Facebook, avis) et la spec `docs/superpowers/specs/`.

---

## Lien du site hebergement : https://ny-tranonay.netlify.app/


# Mise à jour des informations

## Tafir Privatisation : 
200000Ar journée de 8h30 à 18h
200000Ar Nuité de 18h à 9h
inclus : piscine, grande salle, karaoké & dancing, babyfoot, jeux Vidéo sur PC, simulateur de jeux de course au volan, water gun, jeux de société.

# Divers : 
Cinéma, barbecue, cuisine équipé + frigo, sonorisation (JBL), écran TV 80"

# Prix pour les chambres : 
- Chambre double (lit 2 places), toilette exterieur, climatisée, eau chaude, wifi, terrasse privée : '45000Ar/Nuit'
- Chambre Twin (lit 2 places + lit monoplace), Chambre double (lit 2 places), toilette exterieur, climatisée, eau chaude, wifi, terrasse privée, TV : '55000Ar/Nuit'
- Chambre double (lit 2 places), toilette exterieur, climatisée, eau chaude, wifi, terrasse privée, TV: '50000Ar/Nuit'
- Chambre double (lit 2 places), toilette Privé, climatisée, eau chaude, wifi, terrasse privée, TV: '60000Ar/Nuit'

N.B : Horair chambre : 
    check in : 10h
    check out : 10h jour + jour 1

# Restauration
    La restauration est sur commande
    Plat du jour : 10000Ar
    Plat complet (entré + résistance + déssert) : 20000Ar
    Nourriture : autorisation d'apporter de l'exterieur mais les boissons sont sur place

# Réception évènementielle : 
    Pack inclus : Salle Dinatoire, cuisine équipée, couvert complet, nape de table, housse chaise, déco fleurs, sonorisation
    horaire : 8h30 à 18h
    tarif : 150000Ar/Jours
    capacité : 50 personnes
