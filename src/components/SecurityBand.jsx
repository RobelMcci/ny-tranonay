import { security } from '../data/site.js'
import { securityPartner } from '../lib/security.js'
import { ShieldIcon } from './Icons.jsx'
import Reveal from './Reveal.jsx'

const partner = securityPartner(security)

export default function SecurityBand() {
  return (
    <section className="bg-[#2B211B] text-white" aria-labelledby="securite-titre">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-14 lg:py-16">
        <Reveal className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#047857]/25 text-[#34D399]">
          <ShieldIcon width={40} height={40} />
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#34D399]">Sérénité</p>
          <h2 id="securite-titre" className="mt-2 text-white">Un lieu surveillé, pour profiter l’esprit tranquille</h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/80 sm:text-lg">
            {partner ? (
              <>
                Des gardiens employés par les propriétaires veillent sur le site. Récemment, le groupe de sécurité{' '}
                <a href={partner.url} target="_blank" rel="noreferrer" className="font-semibold text-white underline underline-offset-2">
                  {partner.name}
                </a>{' '}
                est venu renforcer ce dispositif : le site reste sous surveillance pendant votre événement.
              </>
            ) : (
              'Des gardiens employés par les propriétaires veillent sur le site, qui reste sous surveillance pendant votre événement.'
            )}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
