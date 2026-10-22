// Registre des photos : srcset WebP générés au build par vite-imagetools.
// Seules les images listées dans src/assets/ sont traitées ; les sources non utilisées sont dans assets-source/.
const srcsets = import.meta.glob('../assets/image*.jpg', {
  query: { w: '480;800;1200;1600', format: 'webp', quality: 70, as: 'srcset' },
  eager: true,
  import: 'default',
})
const fallbacks = import.meta.glob('../assets/image*.jpg', {
  query: { w: '800', format: 'webp', quality: 70 },
  eager: true,
  import: 'default',
})

const raw = {
  // Espace & extérieur
  facadeJour: { file: 'image36', width: 2048, height: 1536, alt: 'Façade de Tranonay et sa piscine sous le soleil, avec la fresque de plage au bord du bassin', category: 'Espace' },
  facade: { file: 'image15', width: 1200, height: 1600, alt: 'Façade de Tranonay avec ses balcons éclairés et la piscine au crépuscule', category: 'Espace' },
  escalier: { file: 'image14', width: 1536, height: 2048, alt: 'Cage d’escalier avec suspensions lumineuses et rambarde en verre', category: 'Espace' },
  // Piscine
  piscine: { file: 'image10', width: 2048, height: 1536, alt: 'Piscine de Tranonay entourée de palmiers et d’un jardin, au crépuscule', category: 'Piscine' },
  piscinePont: { file: 'image11', width: 2048, height: 1536, alt: 'Bord de piscine avec marches d’accès, fresque murale en trompe-l’œil et pelouse', category: 'Piscine' },
  tentes: { file: 'image29', width: 2048, height: 1536, alt: 'Deux tentes de camping installées sur la pelouse au bord de la piscine', category: 'Piscine' },
  // Cinéma en plein air
  cinema: { file: 'image16', width: 2048, height: 1536, alt: 'Cinéma en plein air dans le jardin : écran de projection face à la piscine et à la façade éclairée, de nuit', category: 'Cinéma' },
  cinemaPiscine: { file: 'image25', width: 2048, height: 1536, alt: 'Grand écran de projection installé au bord de la piscine, la nuit', category: 'Cinéma' },
  // Réception
  salle: { file: 'image4', width: 1542, height: 2047, alt: 'Grande salle de réception aux tables dressées de nappes blanches, lustres et mur rouge', category: 'Réception' },
  salleLongue: { file: 'image23', width: 1536, height: 2048, alt: 'Salle de réception en longueur : longues tables dressées, chaises à housses blanches et lustres', category: 'Réception' },
  tableDressee: { file: 'image24', width: 1536, height: 2048, alt: 'Table dressée avec assiettes, verres colorés et bouquet, cuisine équipée en arrière-plan', category: 'Réception' },
  tables: { file: 'image3', width: 1542, height: 2047, alt: 'Tables de réception dressées : housses blanches, vases de fleurs, carafes de jus et couverts dorés', category: 'Réception' },
  // Restauration
  brochettes: { file: 'image5', width: 1542, height: 2047, alt: 'Plateau de brochettes grillées', category: 'Restauration' },
  buffetCrevettes: { file: 'image6', width: 2048, height: 1542, alt: 'Buffet de réception avec présentoirs de crevettes et salades, devant la salle dressée', category: 'Restauration' },
  buffetDesserts: { file: 'image7', width: 1542, height: 2047, alt: 'Cuisine équipée avec bacs chauffants de plats et verrines de dessert à la fraise', category: 'Restauration' },
  buffetPlats: { file: 'image8', width: 1542, height: 2047, alt: 'Buffet froid : crevettes, salades composées, œufs mimosa et volaille panée', category: 'Restauration' },
  buffetSalle: { file: 'image9', width: 1542, height: 2047, alt: 'Buffet de réception avec plats variés et pile d’assiettes, tables dressées au fond', category: 'Restauration' },
  buffetCuisine: { file: 'image21', width: 1542, height: 2047, alt: 'Îlot de la cuisine équipée chargé d’un buffet de salades, charcuteries et fritures', category: 'Restauration' },
  buffetCitron: { file: 'image22', width: 1542, height: 2047, alt: 'Buffet froid avec présentoirs de crevettes, plat de citrons verts, salades composées et œufs mimosa', category: 'Restauration' },
  packRepas: { file: 'image33', width: 600, height: 430, alt: 'Soupe spéciale et mine sao spéciale servies sur un plateau, avec un plat de poulet et riz', category: 'Restauration' },
  // Jeux & soirée
  karaoke: { file: 'image13', width: 2048, height: 1536, alt: 'Salle karaoké et dancing éclairée de jeux de lumière violets, avec fresques sur le thème de la musique', category: 'Soirée' },
  simulateur: { file: 'image12', width: 1536, height: 2048, alt: 'Simulateur de course au volant avec siège, volant, écran et pédales devant une fresque de voiture', category: 'Jeux' },
  simulateurJeu: { file: 'image17', width: 1536, height: 2048, alt: 'Un joueur au volant du simulateur de course, devant la fresque « Racing Team »', category: 'Jeux' },
  babyfoot: { file: 'image2', width: 1542, height: 2047, alt: 'Baby-foot sur la terrasse du bâtiment', category: 'Jeux' },
  babyfootMur: { file: 'image18', width: 2048, height: 1536, alt: 'Baby-foot devant le mur peint « Tranonay » et ses feuilles de monstera, avec la piscine en arrière-plan', category: 'Jeux' },
  jeuxSociete: { file: 'image34', width: 2048, height: 1536, alt: 'Jeux de société posés au sol : Monopoly, échecs, roulette et jeux de cartes', category: 'Jeux' },
  // Enfants
  trampoline: { file: 'image30', width: 1536, height: 2048, alt: 'Trampoline et toboggan pour enfants sur la pelouse, avec la piscine et la façade au soleil', category: 'Enfants' },
  // Chambres
  chambreTwin: { file: 'image27', width: 2048, height: 1536, alt: 'Chambre twin : un lit double et un lit simple, TV murale, climatisation et porte-fenêtre sur la terrasse', category: 'Chambres' },
  chambreVerte: { file: 'image19', width: 1536, height: 2048, alt: 'Chambre au papier peint à feuilles vertes, lit double et terrasse avec vue', category: 'Chambres' },
  chambreViolette: { file: 'image20', width: 1536, height: 2048, alt: 'Chambre avec lit double à motif violet, TV murale et rideaux roses', category: 'Chambres' },
  chambreOrange: { file: 'image26', width: 2048, height: 1536, alt: 'Chambre aux murs orange, lit double à motif de fleurs et grandes fenêtres', category: 'Chambres' },
  chambreTV: { file: 'image28', width: 2048, height: 1536, alt: 'Chambre avec lit double, TV murale, bureau et grande porte-fenêtre', category: 'Chambres' },
  chambreRose: { file: 'image31', width: 2048, height: 1152, alt: 'Chambre spacieuse avec armoire rouge, lit à motif de fleurs roses et TV', category: 'Chambres' },
}

export const photos = Object.fromEntries(
  Object.entries(raw).map(([key, { file, ...rest }]) => {
    const path = `../assets/${file}.jpg`
    return [key, { ...rest, srcSet: srcsets[path], src: fallbacks[path] }]
  }),
)

export const roomPhotoKeys = ['chambreTwin', 'chambreVerte', 'chambreViolette', 'chambreOrange', 'chambreTV', 'chambreRose']

export const galleryKeys = [
  'facadeJour', 'cinema', 'salleLongue', 'chambreTwin', 'piscine', 'trampoline', 'buffetCitron', 'karaoke',
  'simulateurJeu', 'tableDressee', 'cinemaPiscine', 'chambreVerte', 'babyfootMur', 'brochettes', 'jeuxSociete', 'tentes',
  'buffetCuisine', 'chambreRose', 'piscinePont', 'salle', 'chambreViolette', 'escalier', 'buffetPlats', 'tables',
  'chambreOrange', 'facade', 'babyfoot', 'simulateur', 'buffetDesserts', 'buffetCrevettes', 'buffetSalle', 'chambreTV',
]
