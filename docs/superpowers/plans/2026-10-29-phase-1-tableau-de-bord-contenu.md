# Phase 1 — Fondations Supabase et tableau de bord de contenu : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le propriétaire modifie données, textes et photos du site depuis `/admin` et les publie (avec historique et retour arrière), sans toucher au code.

**Architecture:** Les données vivent dans Supabase (Postgres + Auth + Storage, règles RLS). Un bouton « Publier » fige un instantané JSON (`content_snapshots`) et déclenche un build Netlify ; avant chaque build, `scripts/fetch-content.mjs` télécharge le dernier instantané (repli sur `content.seed.json` versionné). `src/data/site.js` garde ses exports actuels mais les construit depuis cet instantané, donc les pages changent peu. L'administration est une section lazy de la même application (React Router), pré-rendue en simple coquille.

**Tech Stack:** React 19, Vite 7, `vite-react-ssg`, Tailwind 3, Vitest, `@supabase/supabase-js`, `@dnd-kit/core` + `@dnd-kit/sortable`, Supabase CLI (local, Docker) + pgTAP, Netlify Functions, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-29-tableau-de-bord-reservation-design.md` (phase 1 uniquement : réservations, calendrier et comptes clients sont les phases 2 et 3).

## Global Constraints

- Stack conservée : React + Vite + Tailwind + Framer Motion ; pas de TypeScript (JSDoc pour les contrats) ; tests avec `npm test` (Vitest, environnement `node`).
- `SITE_URL` reste une constante dans `src/data/site.js` (jamais en base).
- Interface d'administration **en français**, mobile d'abord, contrastes et libellés WCAG AA ; couleurs et typographie du site.
- `/admin/*` : `noindex`, absent du sitemap, `Disallow: /admin/` dans `robots.txt` ; code chargé à la demande ; le client Supabase n'est **jamais** importé par les pages publiques.
- Seules `SUPABASE_URL` / `SUPABASE_ANON_KEY` (et leurs copies `VITE_…`) sont publiques. `BUILD_HOOK_URL` et `SUPABASE_SERVICE_ROLE_KEY` n'existent que dans les variables d'environnement Netlify (fonction, script de seed local), jamais dans le code ni le navigateur.
- Toute autorisation est portée par la RLS ; `content_snapshots` est **append-only** ; le build lit uniquement le dernier instantané publié.
- `npm run build` doit réussir **avec et sans** accès à Supabase (repli seed).
- Photos : < 2 Mo (refus au-delà), redimensionnées à 2000 px max, texte alternatif obligatoire.
- Aucune donnée inventée : le seed est généré depuis les données actuelles.
- Messages de commit se terminent par `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Travailler sur la branche `feat/dashboard-contenu`, pas sur `main`.

## Contrat de contenu (utilisé par toutes les tâches)

JSON `Content` — instantané publié, seed et sortie de `draft_content()` ont **la même forme** (camelCase) :

```js
{
  version: string | null,            // id de l'instantané ; null pour le seed ; ajouté au chargement
  settings: { name, tagline, phone, whatsappNumber, email, facebookUrl, messengerUrl, facebookFollowers,
              street, city, postalCode, country, countryCode, latitude, longitude,
              openHour, closeHour, hoursLabel, roomCheckIn, roomCheckOut,
              securitySummary, securityPartnerName, securityPartnerUrl },
  prices:   [{ key, label, amount, unit: 'ar' | 'personnes' }],   // clés : privatisation_jour, privatisation_nuit,
                                     // reception_jour, reception_max_invites, plat_du_jour, plat_complet, pack_couple
  rooms:    [{ id, name, price, features: string[], photoKeys: string[], quantity }],  // visibles, triées
  lists:    { inclus_privatisation, inclus_reception, extras, activites, pack_couple, types_evenement }, // string[] chacune
  faqs:     [{ question, answer }],                                // visibles, triées
  pages:    [{ path, title, description, priority, navLabel: string | null }],
  photos:   [{ key, file: string | null, storagePath: string | null, alt, category, width, height, galleryPosition: number | null }],
  photoSlots: { [slotKey]: photoKey },    // surcharges seulement (défaut = photo-slots.js)
  texts:    { [textKey]: string },        // surcharges seulement (défaut = text-slots.js)
}
```

`file` = chemin sans extension sous `src/assets/` (`image36` pour le seed, `cms/<key>` pour une photo téléversée) ; `storagePath` = objet du bucket `photos`.
Variables de texte : `{{prix.<clé de prix>}}` (formaté `150 000 Ar`), `{{chambre_min}}` et `{{chambre_max}}` (prix mini et maxi des chambres visibles, `—` s'il n'y en a aucune), `{{tel}}`, `{{email}}`, `{{horaires}}`, `{{checkin}}`, `{{checkout}}`.

## Review Focus

1. Supabase injoignable, réponse HTTP 500, tableau vide ou instantané incomplet pendant `fetch-content` → repli seed, build réussi (Task 5).
2. Variable inconnue (`{{prix.recption}}`) dans une FAQ, une description ou un texte → échec explicite nommant la variable, détecté aussi à l'enregistrement (Tasks 4, 14).
3. Photo supprimée ou fichier absent alors qu'un emplacement ou une chambre y renvoie → aucune page ne plante, repli sur la photo par défaut (Tasks 8, 15).
4. Utilisateur authentifié **non administrateur** (futur compte client) : aucune écriture, aucun appel à `publish_content`/`restore_snapshot`, aucune lecture de l'historique (Tasks 1, 2).
5. Collections vides (toutes les FAQ ou toutes les chambres masquées) et prix saisis invalides (vide, négatif, décimal, texte) : pages construites sans erreur, saisie refusée avec message (Tasks 6, 12, 13).

---

## File Structure

| Fichier | Responsabilité |
|---|---|
| `supabase/migrations/*.sql`, `supabase/tests/*.sql` | schéma, RLS, fonctions, bucket ; tests pgTAP |
| `src/data/content-schema.js` | `validateContent` (contrat) |
| `src/data/content.seed.json` | instantané de secours versionné |
| `src/data/content.snapshot.json` | dernier instantané (gitignoré, écrit avant chaque build/test) |
| `src/data/build-site.js` | `buildSite(content)` pur : produit les exports de `site.js` |
| `src/data/site.js` | exports historiques, construits depuis le snapshot + constantes |
| `src/data/photo-slots.js`, `src/data/text-slots.js` | emplacements déclarés dans le code |
| `src/lib/format.js`, `src/lib/interpolate.js` | formats, variables de texte |
| `src/lib/photo-registry.js`, `src/lib/images.js` | registre de photos (pur) et câblage des imports Vite |
| `scripts/lib/content-loader.mjs`, `scripts/lib/sync-photos.mjs`, `scripts/fetch-content.mjs`, `scripts/seed-db.mjs` | chargement du contenu, téléchargement des photos, import en base |
| `src/admin/**` | application d'administration |
| `netlify/functions/publish.mjs` | publication et restauration |
| `e2e/`, `playwright.config.js` | scénario de bout en bout |

---

### Task 1: Schéma SQL, RLS et bucket

**Files:**
- Create: `supabase/config.toml` (via `npx supabase init`), `supabase/migrations/20261029000001_schema.sql`, `supabase/migrations/20261029000002_rls.sql`, `supabase/tests/01_rls.test.sql`
- Modify: `package.json` (devDependency `supabase`, scripts `db:start`, `db:reset`, `db:test`)

**Interfaces:**
- Produces : tables `admins(user_id)`, `settings` (1 ligne, `id = 1`), `prices`, `rooms`, `list_items`, `faqs`, `pages_seo`, `photos`, `photo_slots`, `texts`, `content_snapshots` (colonnes de la spec ; `photos` a en plus `file text` ; `photos.file` ou `photos.storage_path` non nul), bucket public en lecture `photos`, fonction `is_admin() returns boolean` (`security definer`, `stable`).
- Règles : RLS activée sur toutes les tables ; **aucune** politique pour `anon` ; politiques `for all` réservées à `is_admin()` ; suppression d'une photo référencée par `photo_slots` refusée (FK `restrict`) et par `rooms.photo_keys` (trigger `before delete on photos`) ; bucket : écriture réservée à `is_admin()`.

- [ ] **Step 1:** `git switch -c feat/dashboard-contenu` ; `npm i -D supabase` ; `npx supabase init` ; ajouter les scripts `db:start` (`supabase start`), `db:reset` (`supabase db reset`), `db:test` (`supabase test db`) ; ajouter `supabase/.temp` et `supabase/.branches` à `.gitignore`.
- [ ] **Step 2: Écrire `supabase/tests/01_rls.test.sql` (pgTAP) qui échoue** : `anon` ne peut `select` ni `insert` dans `prices`, `settings`, `faqs`, `photos`, `content_snapshots` (`throws_ok`/`is_empty`) ; un utilisateur authentifié non listé dans `admins` ne peut pas `insert into prices` ni `select` de `content_snapshots` ; un utilisateur présent dans `admins` peut `insert`/`update`/`delete` dans `prices` ; `delete from photos` d'une photo référencée par `photo_slots` échoue ; idem pour une photo listée dans `rooms.photo_keys`.
- [ ] **Step 3:** Lancer `npm run db:start` puis `npm run db:test`. Attendu : échec (tables absentes).
- [ ] **Step 4:** Écrire les deux migrations (schéma puis RLS/bucket/`is_admin`). Positions et `visible` sur `rooms`, `list_items`, `faqs` ; `photos.alt` `not null` et non vide (`check (length(trim(alt)) > 0)`) ; `prices.amount integer check (amount >= 0)`.
- [ ] **Step 5:** `npm run db:reset && npm run db:test`. Attendu : tous les tests passent.
- [ ] **Step 6: Commit** (inclure aussi `docs/superpowers/specs/` et `docs/superpowers/plans/`) : `feat(db): schéma Supabase, RLS et bucket photos`.

---

### Task 2: Fonctions SQL de publication

**Files:**
- Create: `supabase/migrations/20261029000003_publish.sql`, `supabase/tests/02_publish.test.sql`

**Interfaces:**
- Consumes : tables de la Task 1, `is_admin()`.
- Produces :
  - `draft_content() returns jsonb` (admin seulement, `security definer`) : objet `Content` (contrat) construit depuis les tables — éléments `visible` seulement, triés par `position`, `version: null`, `photoSlots`/`texts` en objets clé→valeur, `galleryPosition` nul si hors galerie ;
  - `publish_content(p_label text) returns uuid` (admin seulement) : insère `{ label, created_by = auth.uid(), payload = draft_content() }` et retourne l'id ;
  - `restore_snapshot(p_id uuid) returns uuid` (admin seulement) : insère une **nouvelle** ligne copiant `payload` de `p_id` (étiquette `Retour à la version du <date>`) ;
  - vue `published_content(id, created_at, payload)` = dernière ligne de `content_snapshots` (`security_invoker = false`), `grant select` à `anon` et `authenticated` ;
  - trigger refusant `update` et `delete` sur `content_snapshots` (même pour un admin).

- [ ] **Step 1: Écrire `02_publish.test.sql`** : après insertion de données de test, `draft_content()` contient les clés `settings, prices, rooms, lists, faqs, pages, photos, photoSlots, texts` ; une FAQ `visible = false` est absente ; `publish_content('t')` retourne un uuid et `published_content` renvoie ce payload à `anon` ; deux publications → `published_content` renvoie la seconde ; `restore_snapshot(<première>)` crée une 3ᵉ ligne dont `payload` égale celui de la première ; un non-admin authentifié obtient une exception sur `publish_content`, `restore_snapshot` et `draft_content` ; `update`/`delete` sur `content_snapshots` lèvent une exception pour un admin.
- [ ] **Step 2:** `npm run db:test`. Attendu : échec.
- [ ] **Step 3:** Implémenter la migration (fonctions `plpgsql`, `set search_path = public`, vérification `if not is_admin() then raise exception 'forbidden'`).
- [ ] **Step 4:** `npm run db:reset && npm run db:test`. Attendu : PASS.
- [ ] **Step 5: Commit** : `feat(db): draft_content, publish_content, restore_snapshot, published_content`.

---

### Task 3: Contrat de contenu et seed

**Files:**
- Create: `src/data/content-schema.js`, `src/data/content-schema.test.js`, `scripts/make-seed.mjs` (**jetable**, supprimé après usage), `src/data/content.seed.json`, `src/data/legacy-site.fixture.json`

**Interfaces:**
- Produces : `validateContent(content: unknown): string[]` — liste d'erreurs (vide si valide) : sections et types du contrat, prix `amount` entier ≥ 0, `rooms[].price` entier ≥ 0, clés de prix obligatoires (les 7 du contrat), `photos[].alt` non vide, chaque photo a `file` ou `storagePath`.

- [ ] **Step 1: Écrire `content-schema.test.js`** : `validateContent({})` renvoie des erreurs ; un objet valide minimal renvoie `[]` ; un `amount: -1`, une clé de prix manquante et une photo sans `alt` produisent chacun une erreur mentionnant le champ.
- [ ] **Step 2:** `npx vitest run src/data/content-schema.test.js`. Attendu : FAIL (module absent).
- [ ] **Step 3:** Implémenter `validateContent` dans `src/data/content-schema.js` (sans dépendance, avec le `@typedef Content` JSDoc du contrat).
- [ ] **Step 4:** Écrire `scripts/make-seed.mjs` : importe l'actuel `src/data/site.js`, lit le littéral `raw` de `src/lib/images.js` (extraction du texte entre `const raw = ` et `\n}\n`, évalué avec `new Function`), puis écrit `content.seed.json` (forme du contrat, `version: null`, `photoSlots: {}`, `texts: {}`, `file` = ancien `file`, `galleryPosition` = indice dans `galleryKeys`, `photoKeys` des chambres = `[]`) **et** `legacy-site.fixture.json` (tous les exports actuels de `site.js` sérialisés : `business`, `hours`, `prices`, `packCouple`, `rooms`, `activitiesList`, `eventTypes`, `faqs`, `pages`, listes « inclus »…). Dans le seed, chaque montant en ariary écrit dans une réponse de FAQ ou un titre/description de page est remplacé par sa variable : `150 000 Ar` → `{{prix.reception_jour}}`, `100 000 Ar` → `{{prix.pack_couple}}`, `10 000 Ar` → `{{prix.plat_du_jour}}`, `20 000 Ar` → `{{prix.plat_complet}}`, `45 000 Ar` → `{{chambre_min}}`, `60 000 Ar` → `{{chambre_max}}` ; `200 000 Ar` → `{{prix.privatisation_nuit}}` lorsque la phrase parle de « nuitée », sinon `{{prix.privatisation_jour}}` (y compris « Chacune coûte »). Seuls les montants sont remplacés (les horaires restent du texte libre). La Task 6 prouve que ces remplacements ne changent aucun texte (test d'égalité avec `legacy-site.fixture.json`).
- [ ] **Step 5:** `node scripts/make-seed.mjs`, puis supprimer `scripts/make-seed.mjs` (il n'a jamais été commité) ; ajouter à `content-schema.test.js` : `validateContent(seed)` renvoie `[]`. Lancer le test. Attendu : PASS.
- [ ] **Step 6: Commit** : `feat(contenu): contrat de contenu, validation et seed`.

---

### Task 4: Formats et variables de texte

**Files:**
- Create: `src/lib/format.js`, `src/lib/interpolate.js`, `src/lib/interpolate.test.js`
- Modify: `src/lib/quote.js:3-4` (déplacer `formatAr` et `formatDateFr` dans `format.js`, les ré-exporter depuis `quote.js` pour ne casser aucun import)

**Interfaces:**
- Produces :
  - `formatAr(amount: number): string` (`150 000 Ar`), `formatDateFr(isoDate: string): string` — inchangés ;
  - `buildVars(content): Record<string, string>` — clés `prix.<key>` (valeur `formatAr`, ou `<n>` brut si `unit === 'personnes'`), `chambre_min`, `chambre_max` (`—` si `rooms` est vide), `tel`, `email`, `horaires`, `checkin`, `checkout` ;
  - `interpolate(text: string, vars): string` — remplace `{{nom}}` ; lève `Error('Variable inconnue : {{nom}}')` si absente ;
  - `unknownTokens(text: string, vars): string[]`.

- [ ] **Step 1: Écrire `interpolate.test.js`** : `interpolate('{{prix.reception_jour}}', buildVars(seed))` contient `150` ; `interpolate('a {{prix.recption}} b', vars)` lève un message contenant `{{prix.recption}}` ; `unknownTokens('{{tel}} {{x}} {{y}}', vars)` égale `['x','y']` ; texte sans variable inchangé ; `{{ prix.reception_jour }}` (espaces) accepté ; accolades non fermées (`{{prix`) laissées telles quelles ; montant 0 → `0 Ar` ; `chambre_min`/`chambre_max` valent les prix extrêmes des chambres du seed (`45 000 Ar`, `60 000 Ar`) et `—` avec `rooms: []`.
- [ ] **Step 2:** `npx vitest run src/lib/interpolate.test.js`. Attendu : FAIL.
- [ ] **Step 3:** Implémenter `format.js` et `interpolate.js` ; `quote.js` ré-exporte `formatAr`/`formatDateFr`.
- [ ] **Step 4:** `npx vitest run`. Attendu : PASS (y compris `quote.test.js` existant).
- [ ] **Step 5: Commit** : `feat(contenu): variables de texte et formats partagés`.

---

### Task 5: `fetch-content` avec repli sur le seed

**Files:**
- Create: `scripts/lib/content-loader.mjs`, `scripts/lib/content-loader.test.js`, `scripts/fetch-content.mjs`
- Modify: `package.json` (scripts `prebuild`, `predev`, `pretest` ; `test` inclut `scripts/**/*.test.js`), `vite.config.js:test.include`, `.gitignore` (`src/data/content.snapshot.json`, `src/assets/cms/`)

**Interfaces:**
- Produces : `loadContent({ env, fetchImpl, readSeed, log }): Promise<{ content: Content, source: 'supabase' | 'seed' }>`.
  Avec `env.SUPABASE_URL` et `env.SUPABASE_ANON_KEY`, interroge `GET {SUPABASE_URL}/rest/v1/published_content?select=id,payload&limit=1` (en-têtes `apikey`, `Authorization: Bearer <anon>`), vérifie `validateContent(payload)`, retourne `{ ...payload, version: id }`. **Tout** échec (variables absentes, exception réseau, statut ≠ 2xx, tableau vide, payload invalide, délai > 10 s) → `log` d'un avertissement et seed.
- `scripts/fetch-content.mjs [--seed]` écrit `src/data/content.snapshot.json` (`--seed` : copie du seed sans réseau, utilisé par `pretest`). Sortie : `contenu : <source> (<version>)`.

- [ ] **Step 1: Écrire `content-loader.test.js`** (`fetchImpl` simulé) : réponse valide → `source: 'supabase'` et `version` égale à l'id ; chacun des cas suivants → `source: 'seed'` + un avertissement journalisé : `fetchImpl` rejette, statut 500, corps `[]`, payload sans `prices`, payload avec prix négatif, variables d'environnement absentes.
- [ ] **Step 2:** `npx vitest run scripts/lib/content-loader.test.js`. Attendu : FAIL.
- [ ] **Step 3:** Implémenter `loadContent` (délai via `AbortSignal.timeout(10000)`) et le script CLI ; câbler les `pre*`.
- [ ] **Step 4:** `npm test` (le `pretest` écrit le snapshot depuis le seed). Attendu : PASS.
- [ ] **Step 5: Commit** : `feat(build): fetch-content avec repli sur le seed`.

---

### Task 6: `site.js` construit depuis l'instantané

**Files:**
- Create: `src/data/build-site.js`, `src/data/build-site.test.js`
- Modify: `src/data/site.js` (entièrement), `src/lib/schema.js:36` (`priceRange` dérivé de `rooms`/`prices`), `src/pages/Chambres.jsx:47` (titre dérivé du prix mini et maxi des chambres), `src/components/Faq.jsx` (masquer le bloc si `faqs` vide)

**Interfaces:**
- Consumes : `Content`, `buildVars`, `interpolate`, `formatAr`.
- Produces : `buildSite(content): Site` retournant **exactement** les anciens exports : `business`, `hours`, `security`, `prices` (imbriqué : `privatisation.{jour,nuit}`, `reception.{perDay,maxGuests}`, `meals.{platDuJour,platComplet}`, `couple`), `packCouple`, `privatisationIncludes`, `receptionIncludes`, `extras`, `rooms` (`{id,name,price,features,photoKeys,quantity}`), `activitiesList`, `roomHours`, `eventTypes`, `faqs` (`{q,a}`), `pages` (`{path,nav,title,description,priority}`), plus `photos`, `photoSlots`, `texts`. Textes de FAQ, titres/descriptions de page et `texts` sont déjà interpolés. `site.js` ré-exporte ces valeurs en gardant `SITE_URL`, `mapsEmbedUrl`, `mapsDirectionsUrl`, `whatsappLink`, `pageByPath`, `absoluteUrl` ; il importe `./content.snapshot.json`.
- `phoneHref` = `tel:` + `phone` sans espaces ; `hours.days`/`hours.timeZone` restent des constantes de code.

- [ ] **Step 1: Écrire `build-site.test.js`** : `buildSite(seed)` égal à `legacy-site.fixture.json` section par section après normalisation des espaces (`\s` → espace) pour `business, hours, prices, packCouple, rooms, faqs, pages, extras, eventTypes` ; avec un seed dont `prix reception_jour = 175000`, la réponse de FAQ « réception » contient `175` et `prices.reception.perDay === 175000` ; avec `faqs: []` et `rooms: []`, `buildSite` ne lève pas ; une variable inconnue dans une FAQ fait lever `buildSite` avec le nom de la variable.
- [ ] **Step 2:** `npx vitest run src/data/build-site.test.js`. Attendu : FAIL.
- [ ] **Step 3:** Implémenter `buildSite` ; réécrire `site.js` ; corriger `schema.js` (`priceRange` = prix mini des chambres – prix maxi de privatisation, formaté `MGA`) et `Chambres.jsx`.
- [ ] **Step 4:** `npm test && npm run lint && npm run build`. Attendu : tests et lint verts ; le build termine ; le texte de `dist/tarifs-devis.html` et de `dist/index.html` est identique à celui d'un build de `main` (comparer après normalisation des espaces, les séparateurs de milliers étant des espaces insécables).
- [ ] **Step 5: Commit** : `refactor(contenu): site.js construit depuis l'instantané de contenu`.

---

### Task 7: `buildQuote` injectable

**Files:**
- Modify: `src/lib/quote.js:1,25-80`, `src/lib/quote.test.js`, `src/components/QuoteSimulator.jsx` (aucun changement attendu si l'argument est facultatif)

**Interfaces:**
- Produces : `buildQuote(input, content = { prices, rooms }): { lines, total, warnings }` où `content` a la forme des exports `prices` et `rooms` de `site.js`.

- [ ] **Step 1: Ajouter à `quote.test.js`** : avec `content = { prices: { ...prices, privatisation: { jour: 250000, nuit: 250000 } }, rooms }`, privatisation journée = `250000` ; avec une liste `rooms` d'une seule chambre à 70 000 Ar, 2 chambres 3 nuits = `420000` ; avec `rooms: []`, une chambre demandée est ignorée sans erreur.
- [ ] **Step 2:** `npx vitest run src/lib/quote.test.js`. Attendu : FAIL.
- [ ] **Step 3:** Remplacer les imports figés par le paramètre `content` (valeur par défaut = les exports actuels).
- [ ] **Step 4:** `npx vitest run`. Attendu : PASS.
- [ ] **Step 5: Commit** : `refactor(devis): buildQuote reçoit le contenu en paramètre`.

---

### Task 8: Photos — registre, emplacements, synchronisation Storage

**Files:**
- Create: `src/lib/photo-registry.js`, `src/lib/photo-registry.test.js`, `src/data/photo-slots.js`, `scripts/lib/sync-photos.mjs`, `scripts/lib/sync-photos.test.js`
- Modify: `src/lib/images.js` (globs, registre, `galleryKeys`, `roomPhotoKeys`), `src/components/Photo.jsx`, `scripts/fetch-content.mjs`, composants listés ci-dessous

**Interfaces:**
- Produces :
  - `photoSlots: [{ key, label, page, default }]` ;
  - `buildRegistry(rows: Content['photos'], maps: { srcsets, fallbacks }): Record<string, Photo>` (ignore et signale (`console.warn`) toute photo dont le fichier est absent des `maps`) ;
  - `resolvePhoto(nameOrSlot: string, registry, overrides: Record<string,string>, defaults: Record<string,string>): Photo` — si `nameOrSlot` est un emplacement : surcharge, sinon défaut ; sinon clé de photo ; si la photo visée est absente du registre → photo par défaut de l'emplacement → première photo du registre ; jamais d'exception ;
  - `syncPhotos(content, { fetchImpl, env, dir, writeFile }): Promise<Content>` — pour chaque photo avec `storagePath`, télécharge `{SUPABASE_URL}/storage/v1/object/public/photos/<storagePath>` vers `<dir>/<key>.jpg` et renvoie le contenu avec `file = 'cms/<key>'` ; en cas d'échec de téléchargement, la photo est retirée du contenu avec un avertissement (jamais d'exception) ;
  - `images.js` exporte `photos`, `galleryKeys` (photos avec `galleryPosition`, triées), `roomPhotoKeys` (catégorie `Chambres`), `photo(nameOrSlot)`. Glob : `../assets/{image*.jpg,cms/*.jpg}`.
- Table des emplacements (clé → photo par défaut) : `hero.1` facadeJour · `hero.2` piscine · `hero.3` cinema · `accueil.offre.salle` salleLongue · `accueil.offre.privatisation` facadeJour · `accueil.offre.chambres` chambreTwin · `journee.1` facadeJour · `journee.2` brochettes · `journee.3` piscinePont · `journee.4` karaoke · `journee.5` cinemaPiscine · `journee.6` chambreTV · `bento.1` simulateurJeu · `bento.2` jeuxSociete · `bento.3` trampoline · `bento.4` babyfootMur · `cinema.1` cinemaPiscine · `cinema.2` cinema · `couple.1` chambreOrange · `couple.2` packRepas · `chambres.1` chambreTwin · `chambres.2` facadeJour · `chambres.3` escalier · `privatisation.1` piscine · `privatisation.2` tentes · `salle.1` buffetCitron · `salle.2` buffetDesserts.

- [ ] **Step 1: Écrire `photo-registry.test.js`** : `resolvePhoto('hero.1', …)` renvoie la photo `facadeJour` sans surcharge, la photo surchargée avec `{ 'hero.1': 'piscine' }` ; surcharge vers une clé absente du registre → photo par défaut de l'emplacement ; défaut lui aussi absent → première photo du registre, sans exception ; `resolvePhoto('piscine', …)` (clé directe) fonctionne ; `buildRegistry` ignore une ligne dont le fichier manque dans les `maps`. **`sync-photos.test.js`** : succès → fichier écrit et `file: 'cms/<key>'` ; 404 → photo retirée, avertissement, pas d'exception.
- [ ] **Step 2:** `npx vitest run src/lib/photo-registry.test.js scripts/lib/sync-photos.test.js`. Attendu : FAIL.
- [ ] **Step 3:** Implémenter les modules ; `images.js` lit `photos`/`photoSlots` de `site.js` ; `Photo.jsx` appelle `photo(name)`. Remplacer les clés en dur par les emplacements ci-dessus dans `HeroSlider.jsx`, `Home.jsx`, `DayNight.jsx`, `Bento.jsx`, `CinemaFeature.jsx`, `PackCouple.jsx`, `Chambres.jsx`, `Privatisation.jsx`, `Salle.jsx`. Appeler `syncPhotos` dans `fetch-content.mjs` après `loadContent`.
- [ ] **Step 4:** `npm test && npm run lint && npm run build`. Attendu : PASS ; ouvrir `dist/index.html` : les photos d'accueil sont identiques à avant (mêmes `srcset`).
- [ ] **Step 5: Commit** : `feat(photos): emplacements, registre résilient et synchronisation Storage`.

---

### Task 9: Textes modifiables

**Files:**
- Create: `src/data/text-slots.js`, `src/data/text-slots.test.js`
- Modify: `src/data/site.js` (export `text`), `src/pages/Home.jsx:23-60`, pages `src/pages/{Salle,Privatisation,Chambres,Tarifs,Contact}.jsx` (titre et introduction de `PageHero`)

**Interfaces:**
- Produces : `textSlots: [{ key, page, label, default, multiline }]` ; `getText(key, texts): string` (surcharge sinon défaut ; lève si `key` n'est pas déclarée) ; `text(key)` exporté par `site.js`.
- Emplacements : `accueil.hero.eyebrow`, `accueil.hero.titre`, `accueil.hero.sous-titre`, `accueil.offre.salle.titre|texte`, `accueil.offre.privatisation.titre|texte`, `accueil.offre.chambres.titre|texte`, puis `<page>.hero.titre` et `<page>.hero.intro` pour `salle`, `privatisation`, `chambres`, `tarifs`, `contact`. Défauts = textes actuels recopiés tels quels. Les pages légales restent dans le code (hors phase 1).

- [ ] **Step 1: Écrire `text-slots.test.js`** : clés uniques ; chaque slot a `label` et `default` non vides ; `getText('accueil.hero.titre', {})` renvoie le défaut ; avec `{ 'accueil.hero.titre': 'X' }` renvoie `X` ; clé non déclarée → exception contenant la clé.
- [ ] **Step 2:** `npx vitest run src/data/text-slots.test.js`. Attendu : FAIL.
- [ ] **Step 3:** Implémenter ; remplacer les chaînes en dur par `text('…')` (dans `Home.jsx`, `headline` est calculé depuis `text('accueil.hero.titre')`).
- [ ] **Step 4:** `npm test && npm run build`, puis comparer `dist/index.html` avant/après (texte du `<h1>` identique). Attendu : identique.
- [ ] **Step 5: Commit** : `feat(contenu): emplacements de texte modifiables`.

---

### Task 10: Administration — coquille et connexion

**Files:**
- Create: `src/admin/supabase.js`, `src/admin/auth.jsx`, `src/admin/auth-errors.js`, `src/admin/auth-errors.test.js`, `src/admin/AdminLayout.jsx`, `src/admin/Login.jsx`, `src/admin/pages/Placeholder.jsx`
- Modify: `src/routes.jsx`, `vite.config.js` (`buildRobots`), `package.json` (dépendance `@supabase/supabase-js`), `.env.example`

**Interfaces:**
- Produces :
  - `getSupabase()` — client unique créé à la demande depuis `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` ;
  - `<AuthProvider>` et `useAuth(): { session, isAdmin, loading, signIn(email, password), signOut(), resetPassword(email) }` — `isAdmin` vient de `rpc('is_admin')` ; un compte non admin est déconnecté avec le message « Ce compte n'est pas autorisé. » ;
  - `authErrorMessage(error): string` — messages français (identifiants invalides, trop de tentatives, réseau, défaut) ;
  - `<AdminLayout>` : barre de navigation basse sur mobile, latérale sur ordinateur, liens vers les sections (placeholders), `<Head>` avec `noindex`.
- Routes `admin`, `admin/connexion`, `admin/informations`, `admin/tarifs`, `admin/chambres`, `admin/listes`, `admin/faq`, `admin/photos`, `admin/textes`, `admin/referencement`, `admin/publier` — toutes `lazy`, **sans `Layout` public**, rendu du contenu dans `<ClientOnly>` (coquille pré-rendue identique côté serveur et au premier rendu client).

- [ ] **Step 1: Écrire `auth-errors.test.js`** : `Invalid login credentials` → message contenant « incorrect » ; erreur réseau (`Failed to fetch`) → message de connexion ; code HTTP 429 → « Trop de tentatives » ; `undefined` → message par défaut non vide.
- [ ] **Step 2:** `npx vitest run src/admin/auth-errors.test.js`. Attendu : FAIL.
- [ ] **Step 3:** `npm i @supabase/supabase-js` ; implémenter les modules ; ajouter les routes ; ajouter `Disallow: /admin/` à `buildRobots` ; créer `.env.example` (4 variables publiques, sans valeur).
- [ ] **Step 4:** `npm test && npm run lint && npm run build`. Attendu : PASS ; `dist/admin/index.html` existe, contient `noindex` ; `dist/sitemap.xml` ne contient pas `/admin` ; `dist/robots.txt` contient `Disallow: /admin/` ; aucun fichier JS public (`dist/assets/Home-*.js`) ne contient `supabase`.
- [ ] **Step 5: Vérification manuelle** : `npm run db:start`, créer l'utilisateur admin (Task 18, procédure README) et un second utilisateur non admin, `npm run dev`, ouvrir `/admin` : redirection vers la connexion ; l'admin entre ; le non-admin voit « Ce compte n'est pas autorisé. ».
- [ ] **Step 6: Commit** : `feat(admin): coquille, connexion et garde administrateur`.

---

### Task 11: Administration — écart brouillon/publié et accueil

**Files:**
- Create: `src/admin/diff.js`, `src/admin/diff.test.js`, `src/admin/api.js`, `src/admin/pages/Home.jsx`
- Modify: `src/routes.jsx` (route `admin` → accueil)

**Interfaces:**
- Produces :
  - `diffContent(before: Content | null, after: Content): Change[]` avec `Change = { section: string, label: string, kind: 'added' | 'removed' | 'changed', before?: string, after?: string }` ; sections : `settings, prices, rooms, lists, faqs, pages, photos, photoSlots, texts` ; libellés lisibles en français (`Tarif — Réception, par jour`) ; ignore `version` ; `before = null` → tout en `added` ;
  - `fetchDraft(): Promise<Content>` (`rpc('draft_content')`), `fetchPublished(): Promise<{ id, created_at, payload } | null>` (dernière ligne de `content_snapshots`).
- Accueil : bandeau « N modification(s) non publiée(s) » avec lien vers `/admin/publier` (« Aucune modification à publier » si 0) et raccourcis vers chaque section.

- [ ] **Step 1: Écrire `diff.test.js`** : contenus identiques → `[]` ; prix `reception_jour` 150000 → 175000 → un `Change` `{ section: 'prices', kind: 'changed', before: '150 000 Ar', after: '175 000 Ar' }` ; FAQ ajoutée → `added` ; chambre retirée → `removed` ; texte de FAQ modifié → `changed` ; réordonnancement d'une liste → un `Change` ; `version` différente seule → `[]` ; `before = null` → tout `added`.
- [ ] **Step 2:** `npx vitest run src/admin/diff.test.js`. Attendu : FAIL.
- [ ] **Step 3:** Implémenter `diff.js`, `api.js` (`fetchDraft`, `fetchPublished`) et l'écran d'accueil.
- [ ] **Step 4:** `npx vitest run`. Attendu : PASS. Vérification manuelle : après import du seed (Task 18), le bandeau affiche 0 puis 1 après une modification SQL manuelle d'un prix.
- [ ] **Step 5: Commit** : `feat(admin): écart brouillon/publié et accueil`.

---

### Task 12: Administration — Informations et Tarifs

**Files:**
- Create: `src/admin/validation.js`, `src/admin/validation.test.js`, `src/admin/pages/Informations.jsx`, `src/admin/pages/Tarifs.jsx`, `src/admin/components/Field.jsx`, `src/admin/components/SaveBar.jsx`
- Modify: `src/admin/api.js` (ajout `loadSettings`, `saveSettings`, `loadPrices`, `savePrice`), `src/routes.jsx`

**Interfaces:**
- Produces :
  - `parseAmount(input: string | number): { ok: true, value: number } | { ok: false, error: string }` — accepte `150000`, `150 000`, `150000 Ar` ; refuse vide, négatif, décimal, texte, > 100 000 000 ;
  - `validateUrl(input): string | null` (erreur ou `null`), `validateCoordinates(lat, lng): string | null`, `validateEmail(input): string | null`, `validatePhone(input): string | null` ;
  - `<Field label error hint …>` (étiquette liée, `aria-describedby`), `<SaveBar dirty saving error onSave>` (barre fixe en bas).

- [ ] **Step 1: Écrire `validation.test.js`** : `parseAmount('150 000')` → 150000 ; `''`, `'-5'`, `'12,5'`, `'abc'`, `'1e9'` → `ok: false` avec message non vide ; `validateUrl('facebook')` → erreur, `validateUrl('https://m.me/61588385663321')` → `null` ; `validateCoordinates(-18.945199, 47.431368)` → `null`, `(200, 0)` → erreur ; `validateEmail`/`validatePhone` rejettent `a@b` et `12`.
- [ ] **Step 2:** `npx vitest run src/admin/validation.test.js`. Attendu : FAIL.
- [ ] **Step 3:** Implémenter `validation.js`, les composants et les deux écrans (Informations : les champs de `settings` regroupés Contact / Adresse / Horaires / Sécurité ; Tarifs : un champ par ligne de `prices` avec son `label`, unité affichée).
- [ ] **Step 4:** `npx vitest run && npm run lint`. Attendu : PASS. Vérification manuelle (téléphone 375 px et ordinateur) : saisir `-5` dans un tarif affiche l'erreur et bloque l'enregistrement ; saisir `175 000` enregistre ; le bandeau de l'accueil passe à 1 modification.
- [ ] **Step 5: Commit** : `feat(admin): écrans Informations et Tarifs`.

---

### Task 13: Administration — Chambres et Listes

**Files:**
- Create: `src/admin/reorder.js`, `src/admin/reorder.test.js`, `src/admin/pages/Chambres.jsx`, `src/admin/pages/Listes.jsx`, `src/admin/components/OrderableList.jsx`
- Modify: `src/admin/api.js` (chambres et `list_items`), `package.json` (`@dnd-kit/core`, `@dnd-kit/sortable`), `src/routes.jsx`

**Interfaces:**
- Produces :
  - `moveItem<T>(items: T[], from: number, to: number): T[]` (nouveau tableau) et `withPositions<T>(items: T[]): (T & { position: number })[]` (positions 0…n−1) ;
  - `<OrderableList items renderItem onReorder>` (glisser-déposer avec `@dnd-kit` **et** boutons « monter/descendre » accessibles au clavier).
- Chambres : ajouter, modifier (nom, prix via `parseAmount`, équipements en lignes, photos parmi le registre, `quantity` ≥ 1), masquer, réordonner ; identifiant (`id`) = slug généré à la création, non modifiable ensuite. Listes : une liste par `list_key` (libellés français : « Inclus dans la privatisation », …), ajout, retrait, masquage, ordre.

- [ ] **Step 1: Écrire `reorder.test.js`** : `moveItem([a,b,c], 0, 2)` → `[b,c,a]` ; `from === to` → même contenu ; indices hors bornes → tableau inchangé ; ne mute pas l'entrée ; `withPositions` numérote de 0.
- [ ] **Step 2:** `npx vitest run src/admin/reorder.test.js`. Attendu : FAIL.
- [ ] **Step 3:** Implémenter `reorder.js`, `OrderableList`, les deux écrans ; `quantity` < 1 refusé.
- [ ] **Step 4:** `npx vitest run && npm run lint`. Attendu : PASS. Vérification manuelle : masquer toutes les chambres puis lancer `npm run build` après publication test (Task 17) → pages construites sans erreur, section chambres vide gérée.
- [ ] **Step 5: Commit** : `feat(admin): écrans Chambres et Listes`.

---

### Task 14: Administration — FAQ et Référencement

**Files:**
- Create: `src/admin/pages/Faq.jsx`, `src/admin/pages/Referencement.jsx`, `src/admin/components/TokenHelp.jsx`
- Modify: `src/admin/validation.js` (+ `seoPreview`, `checkTokens`), `src/admin/validation.test.js`, `src/admin/api.js`, `src/routes.jsx`

**Interfaces:**
- Consumes : `unknownTokens`, `buildVars` (Task 4), `OrderableList` (Task 13).
- Produces :
  - `seoPreview(title: string, description: string): { title: string, description: string, titleLength: number, descriptionLength: number, titleStatus: 'ok' | 'long' | 'empty', descriptionStatus: 'ok' | 'long' | 'short' | 'empty' }` — coupe l'aperçu à 60 / 160 caractères avec `…` ;
  - `checkTokens(texts: string[], vars): string | null` — erreur nommant les variables inconnues, sinon `null` (utilisée à l'enregistrement de la FAQ, des titres/descriptions et des textes) ;
  - `<TokenHelp>` : liste des variables disponibles (`Object.keys(buildVars(draft))`) avec bouton « Insérer ».
- FAQ : question, réponse, ordre, masquage, ajout/retrait. Référencement : par page existante (chemin non modifiable), titre, description, priorité, libellé de menu, aperçu Google et compteurs.

- [ ] **Step 1: Ajouter à `validation.test.js`** : `seoPreview` d'un titre de 80 caractères → `titleStatus: 'long'` et aperçu terminé par `…` ; description vide → `'empty'` ; `checkTokens(['Prix {{prix.recption}}'], vars)` → message contenant `prix.recption` ; `checkTokens(['{{prix.reception_jour}}'], vars)` → `null`.
- [ ] **Step 2:** `npx vitest run src/admin/validation.test.js`. Attendu : FAIL.
- [ ] **Step 3:** Implémenter les deux fonctions et les écrans ; l'enregistrement est bloqué avec le message de `checkTokens`.
- [ ] **Step 4:** `npx vitest run && npm run lint`. Attendu : PASS. Vérification manuelle : saisir `{{prix.recption}}` dans une réponse → enregistrement refusé avec le nom de la variable ; réordonner deux questions → bandeau d'accueil + 1.
- [ ] **Step 5: Commit** : `feat(admin): écrans FAQ et Référencement`.

---

### Task 15: Administration — Photos et emplacements

**Files:**
- Create: `src/admin/image.js`, `src/admin/image.test.js`, `src/admin/pages/Photos.jsx`, `src/admin/components/SlotPicker.jsx`
- Modify: `src/admin/api.js` (photos, Storage, `photo_slots`), `src/routes.jsx`

**Interfaces:**
- Produces :
  - `fitWithin(width: number, height: number, maxSide: number): { width: number, height: number }` (jamais agrandi, ratio conservé, entiers) ;
  - `resizeToJpeg(file: File, opts?: { maxSide?: number, maxBytes?: number }): Promise<{ blob: Blob, width: number, height: number }>` — canvas, qualité 0,85 puis 0,75 puis 0,65 jusqu'à `maxBytes` (2 000 000) ; rejette avec un message français si `file.type` n'est pas une image ou si le résultat dépasse encore la limite ;
  - `uploadPhoto({ file, alt, category }): Promise<PhotoRow>` (`photos/<uuid>.jpg`, ligne `photos` avec `storage_path`, `file = null`).
- Écran : liste filtrable par catégorie, téléversement (texte alternatif obligatoire avant envoi), modification de l'`alt`/catégorie/rang de galerie/visibilité, suppression refusée avec la liste des usages (emplacements, chambres) si la photo est utilisée ; section « Emplacements » : pour chaque entrée de `photoSlots` (Task 8), vignette actuelle et choix d'une autre photo ; « Rétablir le défaut » supprime la surcharge.

- [ ] **Step 1: Écrire `image.test.js`** : `fitWithin(4000, 3000, 2000)` → `{2000, 1500}` ; `fitWithin(1000, 800, 2000)` → inchangé ; `fitWithin(1000, 4000, 2000)` → `{500, 2000}` ; dimensions nulles ou négatives → exception.
- [ ] **Step 2:** `npx vitest run src/admin/image.test.js`. Attendu : FAIL.
- [ ] **Step 3:** Implémenter `image.js`, `uploadPhoto`, l'écran et `SlotPicker` ; supprimer une photo utilisée affiche les usages au lieu d'appeler la suppression.
- [ ] **Step 4:** `npx vitest run && npm run lint`. Attendu : PASS. Vérification manuelle : téléverser un JPEG de 6 Mo (l'image est réduite et acceptée), un PDF (refusé), une photo sans `alt` (bouton désactivé) ; surcharger `hero.1` puis « Rétablir le défaut ».
- [ ] **Step 5: Commit** : `feat(admin): photos, téléversement et emplacements`.

---

### Task 16: Administration — Textes des pages

**Files:**
- Create: `src/admin/pages/Textes.jsx`
- Modify: `src/admin/api.js` (table `texts`), `src/routes.jsx`

**Interfaces:**
- Consumes : `textSlots`, `checkTokens`, `<TokenHelp>`, `<SaveBar>`.
- Produces : écran regroupé par `page`, un champ (ligne ou zone selon `multiline`) par entrée de `textSlots`, valeur courante = surcharge ou défaut, « Rétablir le défaut » supprime la ligne `texts`, enregistrement bloqué par `checkTokens`.

- [ ] **Step 1:** Écrire le test d'une fonction pure `effectiveTexts(slots, overrides): Record<string,string>` dans `src/admin/validation.test.js` (surcharge prioritaire, défaut sinon, surcharge vide traitée comme absente) et l'ajouter à `src/admin/validation.js`.
- [ ] **Step 2:** `npx vitest run src/admin/validation.test.js`. Attendu : FAIL.
- [ ] **Step 3:** Implémenter `effectiveTexts` puis l'écran.
- [ ] **Step 4:** `npx vitest run && npm run lint`. Attendu : PASS. Vérification manuelle : modifier `accueil.hero.titre`, enregistrer, « Rétablir le défaut », le bandeau d'accueil revient à 0 modification.
- [ ] **Step 5: Commit** : `feat(admin): écran Textes des pages`.

---

### Task 17: Publier, historique, fonction Netlify et suivi

**Files:**
- Create: `netlify/functions/publish.mjs`, `netlify/functions/publish.test.js`, `src/admin/pages/Publier.jsx`
- Modify: `netlify.toml` (`[functions] directory = "netlify/functions"`), `vite.config.js` (`onFinished` écrit `dist/version.json` ; `test.include` ajoute `netlify/**/*.test.js`), `src/admin/api.js` (`publish`, `restore`, `fetchHistory`, `fetchBuildVersion`)

**Interfaces:**
- Consumes : `diffContent`, `fetchDraft`, `fetchPublished` (Task 11), fonctions SQL (Task 2).
- Produces :
  - `handle(request: Request, deps: { env: Record<string,string|undefined>, fetchImpl: typeof fetch }): Promise<Response>` ; `export default (req) => handle(req, { env: process.env, fetchImpl: fetch })`. `POST` avec `Authorization: Bearer <jeton>` et corps `{ action: 'publish', label?: string }` ou `{ action: 'restore', snapshotId: string }` ; appelle `/rest/v1/rpc/publish_content` (ou `restore_snapshot`) avec la clé anonyme **et le jeton de l'utilisateur** (la RLS/`is_admin()` décide), puis `POST env.BUILD_HOOK_URL` ; réponse `200 { snapshotId }` ; `401` sans jeton, `403` si la fonction SQL refuse, `405` hors `POST`, `502` si le build hook échoue (l'instantané reste enregistré, message clair) ;
  - `dist/version.json` : `{ "snapshot": "<version>" | "seed", "builtAt": "<ISO>" }` ;
  - `fetchBuildVersion(): Promise<string | null>` (`fetch('/version.json', { cache: 'no-store' })`).
- Écran **Publier** : liste des changements (`diffContent(published.payload, draft)`) regroupés par section avec ancien → nouveau, champ « Étiquette » facultatif, bouton **Publier** (désactivé s'il n'y a rien à publier ou pendant l'envoi → pas de double publication), suivi (« En cours… » tant que `version.json` ≠ id ; « En ligne » à l'égalité ; après 10 min : « Échec ou lenteur : la version actuelle reste en ligne » + « Réessayer ») ; **Historique** : 20 dernières versions avec date et étiquette, bouton « Revenir à cette version » avec confirmation.

- [ ] **Step 1: Écrire `publish.test.js`** (`fetchImpl` simulé) : sans `Authorization` → 401 sans appel réseau ; méthode `GET` → 405 ; `publish` réussi → appelle `rpc/publish_content` avec le jeton de l'utilisateur et la clé anonyme puis le build hook, renvoie `{ snapshotId }` ; la RPC répond 403 → réponse 403 et **aucun** appel au build hook ; build hook en échec → 502 avec le `snapshotId` dans le corps ; `restore` appelle `rpc/restore_snapshot` avec `p_id`.
- [ ] **Step 2:** `npx vitest run netlify/functions/publish.test.js`. Attendu : FAIL.
- [ ] **Step 3:** Implémenter la fonction, l'écriture de `version.json`, les appels `api.js` et l'écran.
- [ ] **Step 4:** `npm test && npm run lint && npm run build`. Attendu : PASS ; `dist/version.json` existe avec `"snapshot": "seed"` ; (avec Supabase) la valeur est l'id de l'instantané utilisé.
- [ ] **Step 5: Commit** : `feat(admin): publication, historique et suivi de build`.

---

### Task 18: Import en base, documentation et bout en bout

**Files:**
- Create: `scripts/seed-db.mjs`, `scripts/seed-db.test.js`, `playwright.config.js`, `e2e/publier.spec.js`, `e2e/helpers.js`
- Modify: `package.json` (`@playwright/test`, scripts `seed:db`, `e2e`), `README.md` (nouvelle section « Tableau de bord » et tableau « Où modifier quoi » mis à jour), `netlify.toml` (commentaire des variables), `.env.example`

**Interfaces:**
- Produces : `seedRows(content): Record<string, object[]>` (pur : lignes à insérer par table, snake_case, `position` selon l'ordre) et `scripts/seed-db.mjs` (lit `content.seed.json`, utilise `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, `upsert` idempotent ; refuse de s'exécuter si `content_snapshots` n'est pas vide sans `--force`) ; il publie ensuite un premier instantané « Import initial » via `publish_content` pour que `published_content` ne soit pas vide.
- README documente : création du projet Supabase, variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` dans Netlify pour le build ; `BUILD_HOOK_URL` pour la fonction), création du hook de build Netlify, **création de l'administrateur** (utilisateur créé dans Supabase Auth, puis `insert into admins(user_id) values ('<uuid>')`), usage du bouton Publier, reprise après incident (repli seed).
- Bout en bout (`e2e/publier.spec.js`) contre la base locale : connexion → modification du tarif `reception_jour` à 175 000 → l'écran Publier affiche « Tarif — Réception, par jour : 150 000 Ar → 175 000 Ar » ; le test publie ensuite par RPC avec la session de l'administrateur (la fonction Netlify n'est pas servie par `vite preview`), exécute `node scripts/fetch-content.mjs && npm run build` et vérifie que `dist/tarifs-devis.html` correspond à `/175[\s  ]000/` ; second scénario : un utilisateur non admin se connecte et est refusé.

- [ ] **Step 1: Écrire `seed-db.test.js`** : `seedRows(seed)` contient 7 lignes `prices`, une ligne `settings` avec `id: 1`, des `faqs` avec `position` 0…n−1, des `photos` dont `storage_path` est `null` et `file` renseigné ; deux appels successifs produisent le même résultat (idempotence).
- [ ] **Step 2:** `npx vitest run scripts/seed-db.test.js`. Attendu : FAIL.
- [ ] **Step 3:** Implémenter `seed-db.mjs`, la configuration Playwright (`webServer` : `vite preview` après build), le scénario et les helpers ; rédiger le README.
- [ ] **Step 4:** `npm run db:reset && npm run seed:db && npm run db:test && npm test && npm run lint && npm run e2e`. Attendu : tout passe ; contrôler en outre **sans** variables Supabase : `SUPABASE_URL= npm run build` réussit et `dist/version.json` indique `"snapshot": "seed"`.
- [ ] **Step 5: Vérification finale** : `npm run build` avec Supabase local → `dist/` contient le contenu publié ; `npm run preview`, parcourir `/`, `/tarifs-devis`, `/chambres`, `/contact` : aucun changement visuel par rapport à `main` (mêmes textes, prix, photos).
- [ ] **Step 6: Commit** : `feat: import en base, documentation et test de bout en bout`.

---

## Hors phase 1 (rappel)

Réservations, calendrier, comptes clients et emails (phases 2 et 3) ; création de pages ou de sections ; aperçu du brouillon ; pages légales modifiables (restent dans le code).
