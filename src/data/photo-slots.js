// Emplacements de photos : usages nommés dont le propriétaire peut changer la photo depuis le tableau de bord.
// `default` est la clé de photo utilisée tant qu'aucune surcharge n'est publiée (content.photoSlots).
// Ce fichier ne doit importer aucun asset.

/** @type {Array<{ key: string, label: string, page: string, default: string }>} */
export const photoSlots = [
  { key: 'hero.1', label: 'Bandeau d’accueil, 1re photo (jour)', page: 'Accueil', default: 'facadeJour' },
  { key: 'hero.2', label: 'Bandeau d’accueil, 2e photo (crépuscule)', page: 'Accueil', default: 'piscine' },
  { key: 'hero.3', label: 'Bandeau d’accueil, 3e photo (nuit)', page: 'Accueil', default: 'cinema' },
  { key: 'accueil.offre.salle', label: 'Offre « Salle de réception »', page: 'Accueil', default: 'salleLongue' },
  { key: 'accueil.offre.privatisation', label: 'Offre « Privatisation & piscine »', page: 'Accueil', default: 'facadeJour' },
  { key: 'accueil.offre.chambres', label: 'Offre « Chambres sur place »', page: 'Accueil', default: 'chambreTwin' },
  { key: 'journee.1', label: 'Une journée à Tranonay, 8h30', page: 'Accueil', default: 'facadeJour' },
  { key: 'journee.2', label: 'Une journée à Tranonay, midi', page: 'Accueil', default: 'brochettes' },
  { key: 'journee.3', label: 'Une journée à Tranonay, 18h', page: 'Accueil', default: 'piscinePont' },
  { key: 'journee.4', label: 'Une journée à Tranonay, soirée', page: 'Accueil', default: 'karaoke' },
  { key: 'journee.5', label: 'Une journée à Tranonay, nuit', page: 'Accueil', default: 'cinemaPiscine' },
  { key: 'journee.6', label: 'Une journée à Tranonay, au réveil', page: 'Accueil', default: 'chambreTV' },
  { key: 'bento.1', label: 'Activités, simulateur de course', page: 'Accueil et Privatisation', default: 'simulateurJeu' },
  { key: 'bento.2', label: 'Activités, jeux de société', page: 'Accueil et Privatisation', default: 'jeuxSociete' },
  { key: 'bento.3', label: 'Activités, trampoline', page: 'Accueil et Privatisation', default: 'trampoline' },
  { key: 'bento.4', label: 'Activités, baby-foot', page: 'Accueil et Privatisation', default: 'babyfootMur' },
  { key: 'cinema.1', label: 'Cinéma en plein air, grande photo', page: 'Accueil et Privatisation', default: 'cinemaPiscine' },
  { key: 'cinema.2', label: 'Cinéma en plein air, petite photo', page: 'Accueil et Privatisation', default: 'cinema' },
  { key: 'couple.1', label: 'Pack couple, chambre', page: 'Accueil et Chambres', default: 'chambreOrange' },
  { key: 'couple.2', label: 'Pack couple, repas', page: 'Accueil et Chambres', default: 'packRepas' },
  { key: 'chambres.1', label: 'Chambre twin (carte de la chambre)', page: 'Chambres', default: 'chambreTwin' },
  { key: 'chambres.2', label: 'Chambres, photo du bas à gauche', page: 'Chambres', default: 'facadeJour' },
  { key: 'chambres.3', label: 'Chambres, photo du bas à droite', page: 'Chambres', default: 'escalier' },
  { key: 'privatisation.1', label: 'Privatisation, 1re photo', page: 'Privatisation et piscine', default: 'piscine' },
  { key: 'privatisation.2', label: 'Privatisation, 2e photo', page: 'Privatisation et piscine', default: 'tentes' },
  { key: 'salle.1', label: 'Salle de réception, 1re photo de buffet', page: 'Salle de réception', default: 'buffetCitron' },
  { key: 'salle.2', label: 'Salle de réception, 2e photo de buffet', page: 'Salle de réception', default: 'buffetDesserts' },
]
