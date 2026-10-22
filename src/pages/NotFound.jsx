import { Link } from 'react-router-dom'
import Seo from '../components/Seo.jsx'

export function Component() {
  return (
    <>
      <Seo path="/404" noindex />
      <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
        <p className="eyebrow">Erreur 404</p>
        <h1 className="mt-3">Cette page s’est perdue en route</h1>
        <p className="section-lead">Le lien est peut-être ancien. Retrouvez la salle, la piscine et les chambres de Tranonay depuis l’accueil.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-primary">Retour à l’accueil</Link>
          <Link to="/contact" className="btn-outline">Nous contacter</Link>
        </div>
      </section>
    </>
  )
}
