import Layout from './components/Layout.jsx'

// Chaque page exporte `Component` ; elles sont pré-rendues en HTML au build.
export const routes = [
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, lazy: () => import('./pages/Home.jsx'), entry: 'src/pages/Home.jsx' },
      { path: 'salle-reception-evenements', lazy: () => import('./pages/Salle.jsx'), entry: 'src/pages/Salle.jsx' },
      { path: 'privatisation-piscine', lazy: () => import('./pages/Privatisation.jsx'), entry: 'src/pages/Privatisation.jsx' },
      { path: 'chambres', lazy: () => import('./pages/Chambres.jsx'), entry: 'src/pages/Chambres.jsx' },
      { path: 'tarifs-devis', lazy: () => import('./pages/Tarifs.jsx'), entry: 'src/pages/Tarifs.jsx' },
      { path: 'contact', lazy: () => import('./pages/Contact.jsx'), entry: 'src/pages/Contact.jsx' },
      { path: 'mentions-legales', lazy: () => import('./pages/Legal.jsx'), entry: 'src/pages/Legal.jsx' },
      { path: 'confidentialite', lazy: () => import('./pages/Privacy.jsx'), entry: 'src/pages/Privacy.jsx' },
      // /404 est pré-rendue (servie par Netlify pour les URL inconnues) ; * couvre la navigation côté client.
      { path: '404', lazy: () => import('./pages/NotFound.jsx'), entry: 'src/pages/NotFound.jsx' },
      { path: '*', lazy: () => import('./pages/NotFound.jsx') },
    ],
  },
  // Administration : chargée à la demande, jamais liée aux pages publiques (le client Supabase reste dans ces chunks).
  {
    path: 'admin',
    lazy: () => import('./admin/AdminLayout.jsx'),
    entry: 'src/admin/AdminLayout.jsx',
    children: [
      { index: true, lazy: () => import('./admin/pages/Accueil.jsx'), entry: 'src/admin/pages/Accueil.jsx' },
      { path: 'connexion', lazy: () => import('./admin/Login.jsx'), entry: 'src/admin/Login.jsx' },
      { path: 'informations', lazy: () => import('./admin/pages/Informations.jsx'), entry: 'src/admin/pages/Informations.jsx' },
      { path: 'tarifs', lazy: () => import('./admin/pages/Tarifs.jsx'), entry: 'src/admin/pages/Tarifs.jsx' },
      { path: 'chambres', lazy: () => import('./admin/pages/Chambres.jsx'), entry: 'src/admin/pages/Chambres.jsx' },
      { path: 'listes', lazy: () => import('./admin/pages/Listes.jsx'), entry: 'src/admin/pages/Listes.jsx' },
      { path: 'faq', lazy: () => import('./admin/pages/Faq.jsx'), entry: 'src/admin/pages/Faq.jsx' },
      { path: 'photos', lazy: () => import('./admin/pages/Photos.jsx'), entry: 'src/admin/pages/Photos.jsx' },
      { path: 'textes', lazy: () => import('./admin/pages/Textes.jsx'), entry: 'src/admin/pages/Textes.jsx' },
      { path: 'referencement', lazy: () => import('./admin/pages/Referencement.jsx'), entry: 'src/admin/pages/Referencement.jsx' },
      { path: 'publier', lazy: () => import('./admin/pages/Publier.jsx'), entry: 'src/admin/pages/Publier.jsx' },
    ],
  },
]
