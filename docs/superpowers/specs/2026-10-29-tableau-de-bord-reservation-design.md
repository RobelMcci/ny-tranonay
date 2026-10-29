# Tranonay — tableau de bord, contenu éditable et réservation (design)

Date : 2026-10-29 · Statut : design validé en conversation par le propriétaire, spec à relire

## Objectif

Aujourd'hui Tranonay est un site vitrine pré-rendu (React + Vite + Tailwind, `vite-react-ssg`, Netlify) dont les données
vivent dans `src/data/site.js` et `src/lib/images.js`. Modifier un prix, une photo ou un texte exige de toucher au code.

Cette évolution apporte :
1. un **tableau de bord** (`/admin`) pour modifier données, textes et photos **sans toucher au code** ;
2. des **fonctions d'application web** : demande de réservation avec calendrier de disponibilités, gestion des
   demandes par le propriétaire, comptes clients facultatifs.

## Décisions validées

| Sujet | Décision |
|---|---|
| Utilisateur du tableau de bord | Une seule personne : le propriétaire (un compte administrateur) |
| Fonctions « application » | Réservation avec calendrier, gestion des demandes, comptes clients. **Pas de paiement en ligne.** |
| Stockage | Service géré gratuit : **Supabase** (Postgres, Auth, Storage). Le site reste sur Netlify. |
| Affichage du contenu | **Approche B** : le contenu est « publié » ; un bouton **Publier** reconstruit le site (1 à 2 min). Le HTML reste pré-rendu (SEO). Disponibilités, demandes et comptes sont dynamiques (navigateur). |
| Langue / appareil | Interface d'administration en français, pensée d'abord pour le téléphone |

Contraintes conservées : pas de nom de domaine propre pour l'instant (`SITE_URL` reste la source unique de l'URL de base),
charte graphique et stack existantes, aucune donnée inventée, images < 2 Mo (`rules.md`).

## Périmètre

**Dans le périmètre** : édition des données, textes et photos des emplacements prévus ; publication avec historique et retour
arrière ; demandes de réservation ; calendrier public et calendrier d'administration ; comptes clients facultatifs.

**Hors périmètre** (volontairement) : création de pages, réorganisation de sections, changement de design (restent dans le
code) ; paiement en ligne ; plusieurs administrateurs ou rôles ; aperçu du site avec un brouillon non publié ;
annulation ou modification d'une demande depuis le compte client (passe par WhatsApp/téléphone) ; SMS ; multilingue.

## Architecture

```
Visiteur ──► Site Netlify (HTML pré-rendu) ──► Supabase (lecture directe : disponibilités, demandes, comptes)
                    ▲
                    │ rebuild (build hook)
Propriétaire ──► /admin ──► Supabase (écriture, RLS) ──► « Publier » ──► fonction Netlify ──► build hook
```

- **`/admin/*`** : routes de la même application, chargées à la demande (`lazy`), `noindex`, absentes du sitemap, `Disallow`
  dans `robots.txt`. Le client Supabase n'est chargé que par l'administration et par les composants de réservation/compte, jamais
  par les pages publiques pré-rendues.
- **Sécurité par la base** : toute autorisation est portée par les règles Row Level Security (RLS), pas par l'interface.
  `is_admin()` (fonction SQL) lit la table `admins` (un `user_id`).
- **Secrets** : seule la clé publique (anon) de Supabase est dans le site. La clé de service et l'adresse du build hook
  ne vivent que dans les variables d'environnement Netlify (fonctions et build).

### Contenu : du fichier à la base, sans casser les pages

Principe : `src/data/site.js` garde **les mêmes exports** (`business`, `hours`, `prices`, `rooms`, `faqs`, `pages`, …) mais
leurs valeurs viennent désormais d'un instantané JSON. Les pages changent donc peu.

- `src/data/content.seed.json` — instantané de secours **versionné** (généré une fois à partir de l'actuel `site.js`).
- `src/data/content.snapshot.json` — dernier instantané publié, téléchargé avant le build (ignoré par git).
- `scripts/fetch-content.mjs` (exécuté avant `build` et `dev`) : lit la vue publique `published_content` de Supabase, télécharge
  les photos nouvelles depuis Storage vers `src/assets/cms/` (ignoré par git, traité ensuite par `vite-imagetools`
  comme les photos actuelles), écrit `content.snapshot.json`. **En cas d'échec** (réseau, Supabase indisponible) : message
  d'avertissement et repli sur `content.seed.json`. Le build ne casse jamais.
- `vite.config.js` (sitemap, `robots.txt`, `llms.txt`) et `src/lib/schema.js` (JSON-LD) lisent déjà `site.js` : ils suivent sans
  autre changement.
- Le build écrit `dist/version.json` contenant l'identifiant de l'instantané utilisé (sert au suivi de publication).
- `buildQuote(input)` reçoit les prix et chambres en paramètre (`buildQuote(input, content)`) au lieu de les importer, pour être
  testable avec n'importe quel jeu de données.

### Variables de prix et textes

Dans la FAQ, les descriptions Google et les textes, `{{prix.reception}}`, `{{prix.privatisation_jour}}`, `{{tel}}`, `{{horaires}}`…
sont remplacés au build par la valeur courante (prix formatés en `150 000 Ar`). Liste fermée de variables, documentée dans
l'écran d'aide du tableau de bord. Une variable inconnue **fait échouer le build** avec un message explicite, et l'écran
d'édition la signale dès l'enregistrement.

### Textes modifiables

`src/data/text-slots.js` déclare chaque emplacement : `{ key, page, label, default, multiline }` (ex. `home.hero.title`,
`home.hero.subtitle`, cartes d'offres de l'accueil, mentions légales). Les pages lisent `t('home.hero.title')`. La valeur
publiée remplace le défaut. Ajouter un emplacement = ajouter une entrée dans ce fichier ; il apparaît ensuite dans
l'écran « Textes des pages » sans autre code.

### Photos

Registre `photos` (clé, fichier, texte alternatif, catégorie, dimensions, rang dans la galerie, visible). Les emplacements
(`photo_slots`) associent une photo à chaque usage nommé (« Accueil — carte Salle de réception »). Au téléversement :
redimensionnement côté navigateur (max 2000 px de large, JPEG/WebP), refus au-delà de 2 Mo, texte alternatif obligatoire.
Les photos actuelles de `src/assets/` constituent le seed.

## Modèle de données (Supabase)

Lecture publique (rôle `anon`) uniquement via la vue `published_content` et la fonction `get_availability` ;
écriture réservée à `is_admin()` sauf là où indiqué.

| Table | Colonnes principales |
|---|---|
| `admins` | `user_id` |
| `settings` (1 ligne) | téléphone, numéro WhatsApp, email, URLs Facebook/Messenger, adresse (rue, ville, code postal, pays), latitude/longitude, heure d'ouverture/fermeture, libellé d'horaires, check-in/check-out des chambres, texte et partenaire de sécurité, nombre d'abonnés Facebook |
| `prices` | `key` (pk), `label`, `amount`, `unit` (`ar` ou `personnes`) — ex. `privatisation_jour`, `privatisation_nuit`, `reception_jour`, `reception_max_invites`, `plat_du_jour`, `plat_complet`, `pack_couple` |
| `rooms` | `id` (slug), `name`, `price_ar`, `features` (texte[]), `photo_keys` (texte[]), `quantity` (unités disponibles), `position`, `visible` |
| `list_items` | `list_key` (inclus privatisation, inclus réception, extras, activités, pack couple, types d'événement), `label`, `position`, `visible` |
| `faqs` | `question`, `answer`, `position`, `visible` |
| `pages_seo` | `path` (pk, fixe), `title`, `description`, `priority`, `nav_label` |
| `photos` | `key` (pk), `storage_path`, `alt` (non nul), `category`, `width`, `height`, `gallery_position`, `visible` |
| `photo_slots` | `slot_key` (pk), `photo_key` |
| `texts` | `key` (pk), `value` |
| `content_snapshots` | `id`, `created_at`, `created_by`, `label`, `payload` (jsonb) — **append-only** |
| `profiles` | `user_id` (pk), `full_name`, `phone` |
| `bookings` | voir « Réservations » |
| `blocked_dates` | `id`, `date`, `scope` (`jour`, `nuit`, `chambres`, `tout`), `reason` |

`published_content` expose le payload du **dernier** `content_snapshots`. L'historique complet n'est lisible que par
l'administrateur.

## Publication

1. L'administrateur modifie les tables de contenu (écritures directes, visibles uniquement dans l'administration).
2. L'écran **Publier** calcule le brouillon courant (fonction SQL `draft_content()`), le compare au dernier instantané
   (comparaison côté client) et liste « ce qui va changer » : ancien/nouveau prix, texte modifié, photo remplacée, élément
   ajouté/retiré.
3. Au clic, le navigateur appelle la fonction Netlify `publish` avec le jeton de session. La fonction vérifie `is_admin()`,
   appelle `publish_content(label)` (insère un instantané), puis déclenche le build hook.
4. Le tableau de bord interroge `/version.json` du site : quand l'identifiant correspond à l'instantané publié, l'état passe à
   « en ligne » ; au-delà de 10 minutes sans correspondance, il affiche « échec ou en cours, réessayer » (la version en ligne
   reste l'ancienne).
5. **Retour arrière** : choisir une version dans l'historique crée un **nouvel** instantané copié de l'ancien payload
   (l'historique n'est jamais réécrit) puis redéclenche le build.

Le build lit toujours l'instantané publié, jamais les tables : un brouillon ne fuite pas sur le site, même si un build est
déclenché pour une autre raison (push git).

## Tableau de bord — écrans

Connexion (email + mot de passe, « mot de passe oublié ») puis :

- **Accueil** : bandeau « N modifications non publiées » + bouton Publier ; badge des nouvelles demandes (phase 2) ; raccourcis.
- **Informations** : coordonnées, adresse, GPS, horaires, liens, sécurité.
- **Tarifs** : un champ par prix avec libellé clair, nombre positif obligatoire.
- **Chambres** : ajout, masquage, ordre, prix, équipements, photos, nombre d'unités.
- **Listes** : inclus privatisation/réception, extras, activités, pack couple, types d'événement.
- **FAQ** : réponses, ordre par glisser-déposer, masquage, aide d'insertion des variables.
- **Photos** : téléversement, texte alternatif, catégorie, ordre de la galerie, choix de la photo par emplacement.
- **Textes des pages** : un formulaire par page, généré depuis `text-slots.js`.
- **Référencement** : titre et description par page avec compteur de caractères et aperçu du résultat Google.
- **Publier / Historique** : voir ci-dessus.
- **Réservations**, **Calendrier** (phase 2).

Même charte (couleurs, typographie) que le site, navigation basse sur mobile, champs larges, messages d'erreur en français,
contrastes et libellés conformes WCAG AA.

## Réservations (phase 2)

### Parcours client

Le client choisit une formule (privatisation journée/nuitée, réception, chambres, pack couple), consulte le calendrier public
et envoie une **demande**. Le simulateur de devis existant devient le point d'entrée : bouton « Demander cette
réservation ». Le prix calculé est **enregistré avec la demande** (`quote`) : un changement de tarif ultérieur ne la modifie pas.
Le formulaire de contact Netlify existant reste pour les questions générales.

### Table `bookings`

`id`, `user_id` (nul si invité), `formula`, `start_date`, `end_date`, `slots` (`jour`/`nuit`), `guests`, `nights`, `rooms`
(jsonb : id de chambre → quantité), `couple_packs`, `meals` (jsonb), `event_type`, `contact_name`, `contact_phone`,
`contact_email` (facultatif), `message`, `quote` (jsonb : lignes et total), `status` (`pending`, `confirmed`, `refused`,
`cancelled`), `status_message`, `internal_note`, `created_at`, `updated_at`.

- **Création uniquement par la fonction Netlify `request-booking`** (aucune politique d'insertion pour `anon`) : elle valide
  les champs (dates futures, nombres bornés), force `status = pending`, applique le honeypot et la limite de débit, et
  rattache `user_id` seulement si un jeton de session valide est fourni. Aucune lecture publique.
- Un client connecté lit ses propres lignes ; l'administrateur lit et modifie tout.

### Disponibilités et conflits

- Deux **créneaux d'espace** : `jour` (8h30-18h) et `nuit` (18h-9h).
  - Privatisation journée occupe `jour` ; privatisation nuitée occupe `nuit` ; **réception occupe `jour`** à chaque date de la
    période (et exclut donc la privatisation journée du même jour).
  - Privatisation et chambres sont **indépendantes**.
- **Chambres** : chaque type a `quantity` unités, disponibles nuit par nuit. Le pack couple consomme une unité de chambre, vérifiée
  sur la capacité **totale** (somme des unités) ; l'attribution à un type précis n'est pas suivie.
- Les demandes `pending` ne bloquent rien. Le conflit est contrôlé à la **confirmation** par la fonction SQL
  `confirm_booking(id)` (transaction, verrou) ; en cas de chevauchement elle refuse et renvoie la réservation bloquante.
- `blocked_dates` permet de fermer un créneau, les chambres ou toute la journée (travaux, événement privé).
- `get_availability(from, to)` (publique) renvoie, par date, les créneaux et le nombre de chambres restantes, **sans donnée
  personnelle**.

### Côté administration

- **Réservations** : liste filtrée par statut, détail, **Confirmer / Refuser / Annuler** (message au client optionnel), note
  interne, bouton « Répondre sur WhatsApp » au message prérempli.
- **Calendrier** : vue mensuelle des réservations confirmées, création et suppression de blocages.
- Une nouvelle demande est signalée par un badge. L'envoi d'email d'alerte est facultatif (voir « Emails »).

### Anti-spam

Tout passe par `request-booking` : champ piège (honeypot), limite de débit par IP (empreinte hachée stockée dans une table
`rate_limits`, plafond quotidien), validation et plafonds sur chaque champ.

## Comptes clients (phase 3)

Facultatifs : une demande reste possible sans compte (nom + téléphone). Inscription/connexion par email (mot de passe ou
lien magique, via Supabase Auth). « Mon compte » : nom et téléphone préremplissant les demandes ; « Mes réservations » :
liste et statut. Une demande envoyée avec un email correspondant à un compte existant n'y est **pas** rattachée
automatiquement (seul un envoi en étant connecté rattache la demande).

## Emails — limite connue

Sans nom de domaine propre, l'offre gratuite de la plupart des services d'envoi (par exemple Resend) n'autorise l'envoi qu'à
l'adresse du propriétaire. Conséquence assumée : **le tableau de bord et WhatsApp sont le canal principal** ; les emails
d'inscription et de confirmation sont « au mieux » (piste : Brevo gratuit avec l'adresse du propriétaire vérifiée, délivrabilité
non garantie). Le SMTP intégré de Supabase est trop limité pour de la production. L'achat du nom de domaine règle le sujet ;
la phase 3 doit livrer un fonctionnement correct même sans email (lien magique remplacé par mot de passe par défaut).

## Gestion des erreurs

- Supabase indisponible au build : repli sur `content.seed.json`, avertissement dans les journaux de build.
- Variable de prix inconnue : échec de build explicite, détecté avant en édition.
- Build de publication en échec ou trop long : ancienne version en ligne, état « réessayer » dans le tableau de bord.
- Photos : taille maximale, redimensionnement, texte alternatif obligatoire.
- Confirmation en conflit : message indiquant la réservation bloquante.
- Perte de connexion pendant l'édition : message visible, saisie conservée dans le formulaire.
- Suppression d'un élément référencé (photo utilisée par un emplacement ou une chambre) : refusée avec la liste des usages.
- La page de confidentialité est mise à jour pour décrire les données de réservation et de compte (finalité, conservation,
  contact pour suppression).

## Tests

- **Unitaires (Vitest, déjà en place)** : interpolation des variables, comparaison brouillon/publié, règles de disponibilité
  et de conflit (jour/nuit/réception/chambres/pack couple/blocages), `buildQuote` avec contenu injecté, validation des saisies.
- **Règles de sécurité sur une base Supabase locale** (CLI Supabase) : un anonyme ne peut ni écrire ni lire de données privées ;
  un client ne lit que ses réservations ; un non-administrateur ne peut pas appeler `publish_content` ni `confirm_booking`.
- **Bout en bout (quelques scénarios)** : connexion → modification d'un prix → publication → `version.json` correspondant ;
  demande de réservation → confirmation → date indisponible au calendrier public.
- Build : `npm run build` doit réussir avec **et** sans accès à Supabase (repli seed), et le HTML pré-rendu doit contenir le
  contenu publié (vérification d'un prix dans `dist/`).

## Phasage

Chaque phase est livrable seule et fait l'objet de son propre plan d'implémentation.

1. **Fondations + tableau de bord de contenu** : projet Supabase, schéma et RLS, import du seed, connexion de l'administrateur,
   chargement du contenu par `fetch-content`, refonte de `site.js`/`images.js`/`quote.js`, variables et emplacements de texte,
   écrans de contenu, photos, publication et historique. *Livrable : le site se modifie sans code.*
2. **Réservations et calendrier** : tables et fonctions de disponibilité, formulaire de demande, calendrier public, écrans
   Réservations et Calendrier, blocages, règles de conflit.
3. **Comptes clients et notifications** : inscription/connexion, « Mon compte », « Mes réservations », emails au mieux, mise à
   jour de la page de confidentialité.

## Questions ouvertes (à trancher dans les plans, sans bloquer le design)

- Nombre d'unités par type de chambre (valeur de départ de `quantity` : 1, à renseigner par le propriétaire).
- Création du compte administrateur et de la ligne `admins` : procédure documentée dans le README.
- Quotas de l'offre gratuite Supabase (stockage de photos, projet mis en pause après inactivité prolongée) : à vérifier au
  moment de la phase 1 ; le repli sur le seed protège le site public dans tous les cas.
