# Guide référencement — actions à faire par le propriétaire

Le site est prêt techniquement (pages pré-rendues, balises, données structurées avec adresse, coordonnées GPS et horaires,
sitemap). Ce qui fait vraiment monter dans Google à Antananarivo, ce sont ces actions, qu'aucun code ne peut faire à votre place.

## 1. Fiche Google Business Profile (priorité n°1)
- Créer la fiche sur https://business.google.com : nom « Tranonay », catégorie principale « Salle de réception »
  (ajouter « Location de salle » et « Hôtel / Chambres d'hôtes » si proposé).
- Adresse : Ambohimasina, route vers le CUR Vontovorona, Antananarivo 101. Repère aux coordonnées **-18.945199, 47.431368**.
- Téléphone +261 34 21 410 31, lien du site, **horaires 8h–21h**, photos (extérieur, salle, piscine, chambres, cinéma en plein air).
- Faire valider la fiche (courrier / appel / vidéo). Sans validation elle n'apparaît pas sur Google Maps.

## 2. Google Search Console et Bing Webmaster Tools
- Ajouter le site, puis soumettre `https://ny-tranonay.netlify.app/sitemap.xml`.
- Demander l'indexation de la page d'accueil et des pages de service.

## 3. Avis (0 avis aujourd'hui)
- Après chaque événement, envoyer le lien d'avis Google et inviter à noter la page Facebook (4 000+ abonnés : bon réservoir d'avis).
- Quand de vrais avis existent, on pourra afficher des témoignages et la note sur le site.

## 4. Facebook
- Mettre le lien du site dans la section « À propos » et le bouton d'action de la page.
- Ajouter horaires (8h–21h), services, photos des chambres. Publier régulièrement (événements, photos de réceptions).

## 5. Compléter les mentions légales
- Ajouter la forme juridique, le NIF/STAT et le nom du gérant dans `src/pages/Legal.jsx` (obligations légales à Madagascar).

## 6. À confirmer / compléter
- **Horaires** : le site affiche « ouvert de 8h à 21h » **tous les jours**. S'il y a des jours de fermeture, modifier `hours.days` dans `src/data/site.js`.
- **Pack couple 100 000 Ar** : repris de votre affiche Facebook (chambre pour la nuitée, soupe spéciale ou mine sao, poulet frit ou pané,
  petit-déjeuner offert). Vérifier que l'offre est toujours valable ; sinon modifier ou supprimer `packCouple` dans `src/data/site.js`.
- **Tentes au bord de la piscine** (photo en galerie) : si c'est un service proposé (camping, nuit sous tente), dites-le et on lui consacre un encart.
- Capacité réelle du site, Instagram / TikTok éventuels.
- Autorisation de Dirickx Guard pour afficher leur logo (aujourd'hui : mention texte + lien vers dirickx.mg).
- La photo du karaoké montre une échelle et du matériel de chantier : à remplacer quand une photo propre existe.
- Le mur peint « TRANONAY » affiche l'adresse ny-tranonay.netlify.app : pensez-y le jour du changement de nom de domaine.
