import { Link } from 'react-router-dom'
import { whatsappLink } from '../data/site.js'
import { WhatsappIcon } from './Icons.jsx'
import Reveal from './Reveal.jsx'

export default function CtaBand({ title = 'Une date en tête ?', text = 'Préparez votre devis en deux minutes, ou écrivez-nous directement.' }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:pb-24">
      <Reveal className="relative isolate overflow-hidden rounded-[2rem] bg-[#2B211B] px-6 py-14 text-center text-white sm:px-12">
        <div className="absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-[#C2410C]/60 blur-3xl float-slow" aria-hidden="true" />
        <div className="absolute -bottom-24 -right-24 -z-10 h-72 w-72 rounded-full bg-[#047857]/60 blur-3xl float-slow" style={{ animationDelay: '-3s' }} aria-hidden="true" />
        <h2 className="text-white">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/85">{text}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/tarifs-devis#simulateur" className="btn-primary">Estimer mon événement</Link>
          <a href={whatsappLink('Bonjour Tranonay, je souhaite des informations.')} target="_blank" rel="noreferrer" className="btn-ghost-light">
            <WhatsappIcon /> Écrire sur WhatsApp
          </a>
        </div>
      </Reveal>
    </section>
  )
}
