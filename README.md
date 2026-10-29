# Tranonay — site web

Site de Tranonay (salle de réception, privatisation avec piscine, chambres — Ambohimasina, Antananarivo).
En ligne : https://ny-tranonay.netlify.app/

## Technique

React + Vite + Tailwind + Framer Motion, **pré-rendu en HTML statique** avec `vite-react-ssg` (une page HTML complète par route :
c'est ce qui permet un bon référencement). Hébergé sur Netlify (config dans `netlify.toml`).

**D'où vient le contenu ?** Les informations modifiables (coordonnées, tarifs, chambres, listes, FAQ, référencement, photos, textes)
vivent dans une base Supabase et se modifient depuis le tableau de bord `/admin` (voir plus bas). À chaque build, le script
`scripts/fetch-content.mjs` lit le **dernier instantané publié** et l'écrit dans `src/data/content.snapshot.json` (fichier généré, non
versionné) ; `src/data/site.js` s'en sert. Si Supabase est absent ou injoignable, le build se replie sur `src/data/content.seed.json`
(le contenu d'origine, commité) : **le site se construit toujours**, avec ou sans base.

```bash
npm install
npm run dev        # développement (relit le contenu publié avant de démarrer)
npm run build      # build + pré-rendu des pages + sitemap.xml, robots.txt, llms.txt, version.json dans dist/
npm run preview    # servir dist/ en local
npm test           # tests unitaires (Vitest : devis, contenu, administration, fonction Netlify) ; utilise toujours le seed
npm run lint
npm run db:start   # base Supabase locale (Docker)
npm run db:reset   # recrée la base locale depuis les migrations (efface tout, y compris les comptes de test)
npm run db:test    # tests SQL de la base (droits, publication, ordre)
npm run seed:db    # importe le contenu d'origine (seed) dans la base ; voir « Import du contenu initial »
npm run e2e        # test de bout en bout (Playwright) contre la base locale ; voir « Lancer en local »
npm run og         # régénère public/og-image.jpg (image de partage) depuis une photo
npm run icons      # régénère le logo (icon.svg) et les icônes PNG
```

### Où modifier quoi

| Je veux changer… | Où |
|---|---|
| Un prix, une chambre, un horaire, le téléphone, l'email, l'adresse, une liste (inclus, extras, activités…), la FAQ | Tableau de bord `/admin` (Informations, Tarifs, Chambres, Listes, FAQ), puis **Publier** |
| Le titre / la description Google d'une page, l'intitulé dans le menu | Tableau de bord → Référencement |
| Une photo (ajouter, remplacer, masquer, texte alternatif, ordre de la galerie, photo d'un emplacement) | Tableau de bord → Photos |
| Un texte d'accroche ou de présentation d'une page | Tableau de bord → Textes |
| Ajouter un **nouvel emplacement de texte** modifiable | `src/data/text-slots.js` (puis l'utiliser dans la page avec `text('<clé>')`) |
| Ajouter un **nouvel emplacement de photo** modifiable | `src/data/photo-slots.js` (puis l'utiliser dans la page) |
| La mise en page, le design, une nouvelle page, les mentions légales et la politique de confidentialité | Le code : `src/pages/`, `src/components/`, `src/pages/Legal.jsx`, `src/pages/Privacy.jsx` |
| Les photos fixes (bandeaux de page, trio de la page Salle…) | Le code (liste dans `fixedPhotoUsages`, `src/data/photo-slots.js`) |
| Le calcul du devis | `src/lib/quote.js` (testé dans `quote.test.js`) |
| Le contenu d'origine (repli quand Supabase est inaccessible) | `src/data/content.seed.json` |
| L'adresse du site (`SITE_URL`) | `src/data/site.js` (jamais en base ; voir plus bas) |

Les photos d'origine sont dans `src/assets/` (`imageNN.jpg`) ; les photos téléversées depuis le tableau de bord sont stockées dans
Supabase Storage et téléchargées dans `src/assets/cms/` à chaque build (dossier généré, non versionné). Les sources non utilisées
vivent dans `assets-source/` (hors build).

### Quand le nom de domaine sera acheté

1. Changer `SITE_URL` en haut de `src/data/site.js` (une seule ligne).
2. `npm run build` puis déployer : canonical, Open Graph, JSON-LD, sitemap et robots.txt sont régénérés.
3. Dans Netlify : *Domain management → Add a domain*, puis ajouter l'ancien lien netlify.app en redirection 301 vers le nouveau.
4. Déclarer le nouveau domaine dans Google Search Console et renvoyer le sitemap.
5. Dans Supabase → *Authentication → URL configuration*, ajouter `<nouveau domaine>/admin/connexion` aux adresses de redirection autorisées
   (nécessaire pour « Mot de passe oublié ? »).

### Formulaire de contact

Netlify Forms (formulaire `reservation`). Pour recevoir un email à chaque demande :
Netlify → *Forms → Form notifications → Add notification → Email*, avec tranonay4@gmail.com.

Voir aussi `docs/guide-referencement.md` (Google, Facebook, avis) et la spec `docs/superpowers/specs/`.

## Tableau de bord (/admin)

### Ce que c'est

Une interface en français, réservée aux administrateurs, pour modifier le contenu du site sans toucher au code : informations et
horaires, tarifs, chambres, listes, FAQ, référencement (titres et descriptions Google), photos et textes des pages. On modifie, on
vérifie la liste des changements, puis on clique sur **Publier** : le site est reconstruit par Netlify et en ligne en 1 à 2 minutes.
La page `/admin` n'est pas indexée (`noindex`, absente du sitemap, `Disallow: /admin/` dans `robots.txt`) et son code n'est chargé que
sur ces pages : les pages publiques n'embarquent jamais le client Supabase.

### Mise en place (une seule fois)

1. **Créer le projet Supabase** (supabase.com, offre gratuite suffisante) et noter, dans *Project Settings → API*, l'URL du projet et la
   clé « anon » (publique).
2. **Appliquer le schéma** depuis ce dépôt (`npx supabase` est déjà installé en dépendance) :
   ```bash
   npx supabase login
   npx supabase link --project-ref <référence du projet>
   npx supabase db push        # applique les migrations de supabase/migrations/
   ```
3. **Variables d'environnement Netlify** (*Site configuration → Environment variables*), avec exactement ces noms :

   | Variable | Valeur | Rôle |
   |---|---|---|
   | `SUPABASE_URL` | URL du projet | lue au build (`scripts/fetch-content.mjs`) et par la fonction de publication |
   | `SUPABASE_ANON_KEY` | clé anon (publique) | idem |
   | `VITE_SUPABASE_URL` | URL du projet | lue par le navigateur (écrans d'administration) |
   | `VITE_SUPABASE_ANON_KEY` | clé anon (publique) | idem |
   | `BUILD_HOOK_URL` | adresse du build hook (**secrète**) | la fonction de publication s'en sert pour lancer le build |

   Les quatre premières sont publiques par nature (la sécurité repose sur les règles d'accès de la base). **Ne jamais mettre la clé
   `service_role` dans Netlify**, ni dans le code, ni dans un fichier versionné.
4. **Créer le build hook Netlify** : *Site configuration → Build & deploy → Build hooks → Add build hook* (branche de production),
   puis copier l'adresse obtenue dans `BUILD_HOOK_URL`. Toute personne qui connaît cette adresse peut relancer un build : la garder secrète.
5. **Créer l'administrateur** : dans Supabase → *Authentication → Users → Add user → Create new user* (e-mail et mot de passe, cocher
   « Auto Confirm User »), copier l'identifiant (UUID) de l'utilisateur, puis dans *SQL Editor* :
   ```sql
   insert into public.admins (user_id) values ('<uuid-de-l-utilisateur>');
   ```
   Un utilisateur qui n'est pas dans `admins` peut se connecter à Supabase mais est refusé par le tableau de bord (« Ce compte n'est
   pas autorisé. ») et la base lui interdit toute écriture.
6. **Autoriser la redirection du mot de passe oublié** : Supabase → *Authentication → URL configuration* → *Redirect URLs* : ajouter
   `https://<adresse du site>/admin/connexion` (et l'adresse du site comme *Site URL*).
7. **Importer le contenu initial** (section suivante), puis redéployer le site une fois (*Deploys → Trigger deploy*) pour que le build lise
   la base.

> **E-mails sans domaine propre.** Tant que le site n'a pas de domaine, l'envoi d'e-mails de Supabase (mot de passe oublié) passe par son
> service intégré, très limité (quelques e-mails par heure) : le message peut tarder ou ne pas arriver. Deux solutions : configurer un
> SMTP personnalisé (*Authentication → SMTP Settings*) ou définir directement un mot de passe dans *Authentication → Users*
> (menu de l'utilisateur → *Send password recovery* / modifier le mot de passe).

### Import du contenu initial

Pour que l'administrateur parte du contenu actuel du site, `npm run seed:db` copie `src/data/content.seed.json` dans la base (réglages,
prix, photos, chambres, référencement, listes, FAQ) et publie un premier instantané « Import initial ». Il faut la clé `service_role`
du projet (*Project Settings → API*, affichée une seule fois à la création : la copier tout de suite), uniquement sur votre poste :

```bash
SUPABASE_URL=https://<projet>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<clé service_role> \
  npm run seed:db -- --i-know-this-is-not-local
```

(ou ces deux variables dans `.env.local`, fichier ignoré par git). Le script :

- refuse de s'exécuter si la base contient déjà du contenu (code de sortie 1, rien n'est modifié) ;
- refuse une base qui n'est pas locale sans `--i-know-this-is-not-local` ;
- avec `--force`, **supprime puis réinsère** les tables du site (réglages, prix, chambres, listes, FAQ, référencement, photos,
  emplacements, textes) : toutes les modifications faites depuis le tableau de bord sont perdues. Les instantanés (historique) et les
  fichiers du Storage ne sont jamais supprimés ;
- ne montre jamais la clé.

La clé `service_role` donne tous les droits sur la base : ne la collez nulle part d'autre.

### Utilisation courante

1. Aller sur `https://<adresse du site>/admin`, se connecter.
2. Modifier un écran, **Enregistrer** (le brouillon est enregistré, rien n'est encore en ligne). L'accueil indique combien de
   modifications attendent d'être publiées.
3. **Publier** : relire la liste des changements, donner au besoin un nom à la version, cliquer sur **Publier**. L'écran suit la
   construction (« Construction en cours… » puis « En ligne ») ; compter 1 à 2 minutes.
4. Si la construction échoue ou semble bloquée, le bouton « Relancer la construction » relance le build sans rien republier.

**Revenir en arrière** : écran Publier → *Historique* → « Revenir à cette version » sur une version précédente. Cela crée une nouvelle
version identique à l'ancienne et relance la construction. Les écrans de modification gardent leurs valeurs actuelles : le prochain
« Publier » les remettra en ligne par-dessus la version restaurée.

**Si Supabase est indisponible** : le site public n'est pas touché (c'est un site statique déjà construit). Un nouveau build, lui, se
replie sur `src/data/content.seed.json`, c'est-à-dire sur le contenu d'origine (le build affiche `contenu : seed` dans ses journaux
et `version.json` indique `"snapshot": "seed"`) : pour éviter de remettre en ligne un contenu ancien, ne relancez pas de déploiement
tant que Supabase est en panne, ou republiez ensuite.

**Offre gratuite Supabase** : un projet gratuit est mis en pause après une semaine d'inactivité. Le site public n'est pas affecté
(HTML statique), mais le tableau de bord (et un build pendant la pause, qui se replierait alors sur le seed) a besoin d'un projet réveillé :
le relancer depuis le tableau de bord Supabase (*Restore project*) avant de travailler.

**Supprimer l'administrateur** : `content_snapshots.created_by` référence l'utilisateur Supabase de la personne qui a publié. Supprimer
cet utilisateur dans Supabase Auth est refusé tant que des versions publiées le référencent ; il faut d'abord une migration ou un
nettoyage prévu pour cela (les instantanés sont en ajout seul et ne se modifient pas). Pour retirer l'accès d'une personne, supprimer
simplement sa ligne de `public.admins`.

### Ce qui ne se modifie PAS depuis le tableau de bord

- la mise en page, le design, les couleurs et les polices ;
- la création de nouvelles pages ou de nouvelles sections ;
- les pages légales (mentions légales, confidentialité), qui restent dans le code ;
- les photos fixes : bandeaux (PageHero) des pages Contact, Privatisation, Chambres, Salle de réception et Tarifs, trio de photos de la
  page Salle (parallaxe) et carte d'invitation à partager. Elles sont listées dans `fixedPhotoUsages` (`src/data/photo-slots.js`) et
  ne peuvent être ni masquées ni supprimées ;
- l'adresse du site (`SITE_URL`, voir « Quand le nom de domaine sera acheté »).

### Lancer en local

Prérequis : Docker (pour la base locale), Node 22.

```bash
npm install
npm run db:start          # base Supabase locale (http://127.0.0.1:54321)
npx supabase status -o env   # affiche API_URL, ANON_KEY, SERVICE_ROLE_KEY de la base locale
```

1. Créer `.env.local` (ignoré par git) avec `VITE_SUPABASE_URL=<API_URL>` et `VITE_SUPABASE_ANON_KEY=<ANON_KEY>`. Pour que le build lise
   aussi la base locale, ajouter `SUPABASE_URL=<API_URL>` et `SUPABASE_ANON_KEY=<ANON_KEY>`.
2. Importer le contenu : `SUPABASE_URL=<API_URL> SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY> npm run seed:db`.
3. **Créer un administrateur de test** (la base locale est jetable) avec l'API d'administration de GoTrue, en utilisant la clé
   `SERVICE_ROLE_KEY` locale, sans jamais l'écrire dans un fichier versionné :
   - `POST <API_URL>/auth/v1/admin/users`, en-têtes `apikey` et `Authorization: Bearer <SERVICE_ROLE_KEY>`, corps JSON
     `{ "email": "...", "password": "<mot de passe de test>", "email_confirm": true }` : la réponse contient l'`id` de l'utilisateur ;
   - `POST <API_URL>/rest/v1/admins` (mêmes en-têtes, `Prefer: return=minimal`), corps `{ "user_id": "<id>" }`.
4. `npm run dev`, puis ouvrir `/admin` et se connecter avec ce compte. Les e-mails de la base locale (mot de passe oublié) arrivent dans
   Mailpit (http://127.0.0.1:54324) ; pour tester le lien, ajouter l'adresse locale de `vite` à `additional_redirect_urls` dans
   `supabase/config.toml`.
5. Le bouton Publier appelle la fonction Netlify `netlify/functions/publish.mjs`, que `npm run dev` ne sert pas : pour l'essayer en
   local, utiliser `netlify dev` (Netlify CLI) avec `SUPABASE_URL`, `SUPABASE_ANON_KEY` et un `BUILD_HOOK_URL` de test.

**Tests**

- `npm test` : tests unitaires (aucune base requise ; `pretest` force le seed).
- `npm run db:test` : tests SQL (base locale démarrée) : droits, RLS, publication, ordre des listes.
- `npm run e2e` : parcours complet avec Playwright (première fois : `npx playwright install chromium`). Il **réinitialise la base
  locale** (`db:reset`), importe le contenu, crée deux comptes jetables (un administrateur, un non administrateur, mots de passe
  aléatoires, supprimés à la fin), reconstruit le site avec la base locale et vérifie : connexion, modification d'un tarif, liste des
  changements, publication, contenu du site reconstruit, et refus d'un compte non administrateur. Il refuse de tourner contre une base
  qui n'est pas locale. À la fin, les comptes de test sont supprimés mais la base locale reste dans l'état du test (tarif de réception
  modifié, deux instantanés) et `dist/` contient le site construit avec cette base : pour repartir du contenu d'origine, relancer
  `npm run db:reset && npm run seed:db`. Il ne passe pas par la fonction Netlify
  (testée par `netlify/tests/publish.test.js`) : la publication y est faite par l'appel SQL `publish_content` avec la session de
  l'administrateur.

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
