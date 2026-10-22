import {
  PartyPopper,
  Trophy,
  Waves,
  Dice5,
  Mic2,
  Flame,
  Gamepad2,
  Droplets,
  Leaf,
  Clapperboard,
  Cake,
  Sparkles,
  Briefcase,
  Camera,
  Refrigerator,
  Tv2,
  Wifi,
  Car,
  MapPin,
  Handshake,
  Smartphone,
  Users,
  Clock,
  CreditCard,
} from 'lucide-react'
import maison from '../assets/image15.jpg'
import evenement3 from '../assets/image1.jpg'
import babyfoot from '../assets/image2.jpg'
import evenement1 from '../assets/image3.jpg'
import evenement2 from '../assets/image4.jpg'
import grillades from '../assets/image5.jpg'
import nourriture1 from '../assets/image6.jpg'
import nourriture2 from '../assets/image7.jpg'
import nourriture3 from '../assets/image8.jpg'
import nourriture4 from '../assets/image9.jpg'
import vuejardin from '../assets/image10.jpg'
import jardin2 from '../assets/image11.jpg'
import jeuxvideos from '../assets/image12.jpg'
import karaoke from '../assets/image13.jpg'
import escalier from '../assets/image14.jpg'

export const logo = '/icon.svg'

export const heroImages = [maison, evenement2, vuejardin]

export const activities = [
  { title: 'Location de salle pour événements', desc: 'Espaces modulables avec décoration personnalisée.', icon: PartyPopper },
  { title: 'Baby-foot', desc: 'Matches conviviaux et tournois privés.', icon: Trophy },
  { title: 'Piscine', desc: 'Eau claire, transats et ambiance tropicale.', icon: Waves },
  { title: 'Jeux de société', desc: 'Jeux modernes et classiques pour tous.', icon: Dice5 },
  { title: 'Karaoké & dancing', desc: 'Soirées chantantes avec sono premium.', icon: Mic2 },
  { title: 'Grillades / Barbecue', desc: 'Espace grillades équipé.', icon: Flame },
  { title: 'Jeux vidéo & simulateur', desc: 'Consoles, jeux PC et simulateur de course au volant.', icon: Gamepad2 },
  { title: "Water gun", desc: "Batailles d'eau conviviales pour petits et grands.", icon: Droplets },
  { title: 'Jardin zen', desc: 'Nature calme pour se ressourcer.', icon: Leaf },
  { title: 'Cinéma & projection', desc: 'Écran TV 80" et son immersif.', icon: Clapperboard },
  { title: 'Anniversaires', desc: 'Forfaits enfants & adultes.', icon: Cake },
  { title: 'Soirées à thème', desc: 'Quiz games, karaoké nights.', icon: Sparkles },
  { title: 'Coworking calme', desc: 'Espace zen en journée.', icon: Briefcase },
  { title: 'Photo booth', desc: 'Souvenirs instantanés.', icon: Camera },
]

export const gallery = [
  { src: maison, alt: 'Vue de la maison', category: 'Piscine' },
  { src: vuejardin, alt: 'Vue du jardin', category: 'Jardin' },
  { src: grillades, alt: 'Espace barbecue', category: 'Grillades' },
  { src: babyfoot, alt: 'Baby-foot', category: 'Jeux' },
  { src: karaoke, alt: 'Karaoké', category: 'Soirée' },
  { src: escalier, alt: 'Escalier', category: 'Espace' },
  { src: jeuxvideos, alt: 'Aire jeux vidéo', category: 'Jeux' },
  { src: nourriture1, alt: 'Nourriture 1', category: 'Nourriture' },
  { src: nourriture2, alt: 'Nourriture 2', category: 'Nourriture' },
  { src: nourriture3, alt: 'Nourriture 3', category: 'Nourriture' },
  { src: nourriture4, alt: 'Nourriture 4', category: 'Nourriture' },
  { src: evenement1, alt: 'Événement privé', category: 'Événement' },
  { src: evenement2, alt: 'Salle événement', category: 'Événement' },
  { src: evenement3, alt: 'Ambiance soirée', category: 'Soirée' },
  { src: jardin2, alt: 'Jardin zen', category: 'Jardin' },
]

// Tailles de tuiles pour la grille bento (répétées en boucle sur la liste filtrée)
export const galleryTileSpans = [
  'sm:col-span-2 sm:row-span-2',
  '',
  '',
  'sm:row-span-2',
  '',
  '',
  'sm:col-span-2',
  '',
]

export const stats = [
  { label: 'Activités & espaces', value: '15+' },
  { label: 'De jardin', value: '1500 m²' },
  { label: 'Capacité max', value: '120 pers.' },
  { label: 'Ouvert', value: '7j/7' },
]

export const rentalPackages = [
  {
    name: 'Tafir Privatisation — Journée',
    price: '200 000 Ar',
    period: '/ journée (8h30 - 18h)',
    includes: ['Accès piscine', 'Grande salle', 'Karaoké & dancing', 'Baby-foot', 'Jeux vidéo sur PC', 'Simulateur de course au volant', 'Water gun', 'Jeux de société'],
  },
  {
    name: 'Tafir Privatisation — Nuitée',
    price: '200 000 Ar',
    period: '/ nuitée (18h - 9h)',
    includes: ['Accès piscine', 'Grande salle', 'Karaoké & dancing', 'Baby-foot', 'Jeux vidéo sur PC', 'Simulateur de course au volant', 'Water gun', 'Jeux de société'],
    featured: true,
  },
]

export const eventPackage = {
  name: 'Réception événementielle',
  price: '150 000 Ar',
  period: '/ jour (8h30 - 18h)',
  capacity: "Jusqu'à 50 personnes",
  includes: ['Salle dinatoire', 'Cuisine équipée', 'Couvert complet', 'Nappage de table', 'Housses de chaise', 'Décoration fleurs', 'Sonorisation'],
}

export const rooms = [
  {
    name: 'Chambre double',
    price: '45 000 Ar',
    features: ['Lit 2 places', 'Toilette extérieure', 'Climatisée', 'Eau chaude', 'Wifi', 'Terrasse privée'],
  },
  {
    name: 'Chambre Twin',
    price: '55 000 Ar',
    features: ['Lit 2 places + lit monoplace', 'Toilette extérieure', 'Climatisée', 'Eau chaude', 'Wifi', 'Terrasse privée', 'TV'],
    featured: true,
  },
  {
    name: 'Chambre double avec TV',
    price: '50 000 Ar',
    features: ['Lit 2 places', 'Toilette extérieure', 'Climatisée', 'Eau chaude', 'Wifi', 'Terrasse privée', 'TV'],
  },
  {
    name: 'Chambre double, toilette privée',
    price: '60 000 Ar',
    features: ['Lit 2 places', 'Toilette privée', 'Climatisée', 'Eau chaude', 'Wifi', 'Terrasse privée', 'TV'],
  },
]

export const dining = {
  items: [
    { name: 'Plat du jour', price: '10 000 Ar' },
    { name: 'Plat complet (entrée + résistance + dessert)', price: '20 000 Ar' },
  ],
  note: 'Vous pouvez apporter votre propre nourriture — les boissons sont servies sur place.',
}

export const amenities = [
  { label: 'Cinéma', icon: Clapperboard },
  { label: 'Barbecue', icon: Flame },
  { label: 'Cuisine équipée + frigo', icon: Refrigerator },
  { label: 'Sonorisation JBL', icon: Mic2 },
  { label: 'Écran TV 80"', icon: Tv2 },
  { label: 'Wifi gratuit', icon: Wifi },
  { label: 'Parking sécurisé', icon: Car },
]

export const aboutHighlights = [
  { title: 'Localisation stratégique', desc: 'À 10 min du CUR, accès rapide et sécurisé.', icon: MapPin },
  { title: 'Ambiance nature', desc: 'Jardin luxuriant de 2000m², calme et ressourçant.', icon: Leaf },
  { title: 'Services partenaires', desc: 'Traiteur, photographe, location de matériel.', icon: Handshake },
  { title: 'Réservations faciles', desc: 'Par WhatsApp ou par téléphone, réponse sous 24h.', icon: Smartphone },
]

export const infoCards = [
  { label: 'Capacité', value: "Jusqu'à 120 pers. (site)", icon: Users },
  { label: 'Horaires', value: '08h - 22h', icon: Clock },
  { label: 'Paiement', value: 'Espèces / Mobile money', icon: CreditCard },
  { label: 'Wifi', value: 'Gratuit haut débit', icon: Wifi },
]

export const faqs = [
  {
    q: 'Quels sont les horaires pour les chambres ?',
    a: 'Le check-in se fait à partir de 10h et le check-out le lendemain à 10h.',
  },
  {
    q: 'Peut-on apporter notre propre nourriture ?',
    a: "Oui, vous pouvez apporter votre nourriture. Les boissons, elles, sont servies sur place. Un service de restauration sur commande est aussi disponible (plat du jour ou plat complet).",
  },
  {
    q: 'Quelle est la différence entre la privatisation Tafir et la réception événementielle ?',
    a: "La privatisation Tafir (journée ou nuitée, 200 000 Ar) donne accès à l'ensemble des loisirs : piscine, salle, karaoké, baby-foot, jeux vidéo, simulateur de course, water gun. La réception événementielle (150 000 Ar/jour, jusqu'à 50 personnes) est plutôt un pack traiteur pour un événement formel : salle dinatoire, cuisine équipée, couverts, nappage, déco et sonorisation.",
  },
  {
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: 'Nous acceptons les espèces et le mobile money.',
  },
  {
    q: 'Le wifi et le parking sont-ils inclus ?',
    a: 'Oui, le wifi gratuit et un parking sécurisé sont disponibles pour tous nos visiteurs.',
  },
  {
    q: 'Quelle est la capacité maximale du site ?',
    a: "L'espace peut accueillir jusqu'à 120 personnes, avec une capacité de 50 personnes pour la formule réception événementielle.",
  },
  {
    q: 'Comment réserver et sous quel délai avez-vous une réponse ?',
    a: 'Vous pouvez réserver directement par WhatsApp ou par téléphone. Nous répondons sous 24h.',
  },
]

export const navLinks = [
  { label: 'À propos', href: '#about' },
  { label: 'Activités', href: '#activities' },
  { label: 'Galerie', href: '#gallery' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
]

export const whatsappNumber = '+261342141031'
export const whatsappLink = 'https://wa.me/261342141031'

export const revealVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}
