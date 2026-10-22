import { faqs } from '../data/site.js'

/** FAQ en <details> natifs : accessible, sans JS, et le texte est présent dans le HTML pré-rendu. */
export default function Faq() {
  return (
    <div className="space-y-3">
      {faqs.map(({ q, a }, i) => (
        <details key={q} className="group rounded-2xl bg-white shadow-soft ring-1 ring-black/5" open={i === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-[#2B211B] [&::-webkit-details-marker]:hidden">
            {q}
            <span aria-hidden="true" className="text-xl text-[#C2410C] transition-transform duration-300 group-open:rotate-45">+</span>
          </summary>
          <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:text-base">{a}</p>
        </details>
      ))}
    </div>
  )
}
