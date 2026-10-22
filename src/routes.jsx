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
]
