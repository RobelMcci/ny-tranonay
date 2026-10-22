import Photo from './Photo.jsx'
import Reveal from './Reveal.jsx'

const cells = [
  { photo: 'simulateurJeu', title: 'Simulateur de course', text: 'Siège, volant et pédales : prenez le départ.', cls: 'md:row-span-2' },
  { photo: 'jeuxSociete', title: 'Jeux de société', text: 'Monopoly, échecs, roulette et cartes.', cls: '' },
  { photo: 'trampoline', title: 'Trampoline & toboggan', text: 'De quoi occuper les enfants toute la journée.', cls: 'md:row-span-2' },
  { photo: 'babyfootMur', title: 'Baby-foot', text: 'Des tournois entre amis, face à la piscine.', cls: '' },
]

/** Mosaïque d'activités : zoom de la photo et légende qui monte au survol. */
export default function Bento() {
  return (
    <ul className="grid auto-rows-[280px] gap-4 md:auto-rows-[250px] md:grid-cols-3">
      {cells.map((c, i) => (
        <Reveal as="li" key={c.photo} delay={i * 0.08} className={`group relative overflow-hidden rounded-3xl bg-slate-200 shadow-soft ${c.cls}`}>
          <Photo name={c.photo} sizes="(min-width: 768px) 33vw, 100vw" className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 translate-y-2 p-5 text-white transition duration-500 group-hover:translate-y-0">
            <h3 className="text-white">{c.title}</h3>
            <p className="mt-1 text-sm text-white/85">{c.text}</p>
          </div>
        </Reveal>
      ))}
    </ul>
  )
}
