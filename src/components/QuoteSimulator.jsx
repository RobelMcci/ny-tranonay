import { useMemo, useState } from 'react'
import { business, eventTypes, prices, rooms, whatsappLink } from '../data/site.js'
import { roomPriceRange } from '../lib/rooms.js'
import { buildQuote, emptyQuoteInput, formatAr, quoteToMessage } from '../lib/quote.js'
import { MessengerIcon, MoonIcon, SunIcon, WhatsappIcon } from './Icons.jsx'
import InvitationCard from './InvitationCard.jsx'

function Stepper({ id, label, value, onChange, min = 0, max = 99, hint }) {
  const set = (n) => onChange(Math.max(min, Math.min(max, n)))
  const btn = 'touch-target flex h-10 w-10 items-center justify-center rounded-full bg-[#FDF6EC] text-xl font-bold text-[#9A3412] ring-1 ring-black/10 transition hover:bg-[#C2410C] hover:text-white disabled:opacity-40'
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-[#2B211B]">{label}</label>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} onClick={() => set(value - 1)} disabled={value <= min} aria-label={`Moins : ${label}`}>−</button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => set(Number.parseInt(e.target.value, 10) || min)}
          className="h-10 w-14 rounded-lg border border-slate-300 text-center text-base font-semibold"
        />
        <button type="button" className={btn} onClick={() => set(value + 1)} disabled={value >= max} aria-label={`Plus : ${label}`}>+</button>
      </div>
    </div>
  )
}

const roomRange = roomPriceRange(rooms)

const formulas = [
  { id: 'privatisation', title: 'Privatisation', desc: 'Piscine, salle, karaoké et jeux rien que pour vous', price: `${formatAr(prices.privatisation.jour)} / créneau` },
  { id: 'reception', title: 'Réception', desc: `Salle dinatoire équipée, jusqu’à ${prices.reception.maxGuests} personnes`, price: `${formatAr(prices.reception.perDay)} / jour` },
  { id: 'couple', title: 'Pack couple', desc: 'Nuitée, repas et petit-déjeuner offert', price: `${formatAr(prices.couple)} / pack` },
  { id: 'sejour', title: 'Chambres seules', desc: 'Passer la nuit sur place', price: roomRange ? `dès ${formatAr(roomRange.min)} / nuit` : null },
]

export default function QuoteSimulator() {
  const [input, setInput] = useState(emptyQuoteInput)
  const [showInvite, setShowInvite] = useState(false)
  const [copied, setCopied] = useState(false)

  const patch = (changes) => setInput((prev) => ({ ...prev, ...changes }))
  const quote = useMemo(() => buildQuote(input), [input])
  const message = useMemo(() => quoteToMessage(input, quote), [input, quote])
  const hasTotal = quote.total > 0

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="space-y-6">
        <fieldset className="card-surface">
          <legend className="font-display text-xl font-semibold">1. Votre formule</legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {formulas.map((f) => (
              <label
                key={f.id}
                className={`cursor-pointer rounded-2xl border-2 p-4 transition has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-[#047857] ${
                  input.formula === f.id ? 'border-[#C2410C] bg-[#FFF7ED]' : 'border-slate-200 hover:border-[#C2410C]/50'
                }`}
              >
                <input type="radio" name="formula" value={f.id} checked={input.formula === f.id} onChange={() => patch({ formula: f.id })} className="sr-only" />
                <span className="block font-semibold text-[#2B211B]">{f.title}</span>
                <span className="mt-1 block text-xs leading-snug text-slate-600">{f.desc}</span>
                {f.price && <span className="mt-2 block text-sm font-bold text-[#C2410C]">{f.price}</span>}
              </label>
            ))}
          </div>

          {input.formula === 'privatisation' && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { key: 'jour', title: 'Journée', hours: '8h30 → 18h', Icon: SunIcon },
                { key: 'nuit', title: 'Nuitée', hours: '18h → 9h', Icon: MoonIcon },
              ].map(({ key, title, hours, Icon }) => (
                <label
                  key={key}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-[#047857] ${
                    input.slots[key] ? 'border-[#047857] bg-[#ECFDF5]' : 'border-slate-200 hover:border-[#047857]/50'
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={input.slots[key]} onChange={(e) => patch({ slots: { ...input.slots, [key]: e.target.checked } })} />
                  <Icon width={26} height={26} className="text-[#047857]" />
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="block text-xs text-slate-600">{hours} · {formatAr(prices.privatisation[key])}</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {input.formula === 'couple' && (
            <div className="mt-5">
              <Stepper id="q-packs" label="Nombre de packs couple" value={input.couplePacks} min={1} max={10} onChange={(n) => patch({ couplePacks: n })} />
            </div>
          )}

          {input.formula === 'reception' && (
            <div className="mt-5">
              <Stepper id="q-days" label="Nombre de jours" value={input.receptionDays} min={1} max={7} onChange={(n) => patch({ receptionDays: n })} />
            </div>
          )}
        </fieldset>

        <fieldset className="card-surface">
          <legend className="font-display text-xl font-semibold">2. Votre événement</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="q-event" className="field-label">Type d’événement</label>
              <select id="q-event" className="input-field" value={input.eventType} onChange={(e) => patch({ eventType: e.target.value })}>
                <option value="">Choisir…</option>
                {eventTypes.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="q-date" className="field-label">Date</label>
              <input id="q-date" type="date" className="input-field" value={input.date} onChange={(e) => patch({ date: e.target.value })} />
            </div>
            <div>
              <label htmlFor="q-name" className="field-label">Votre prénom</label>
              <input id="q-name" className="input-field" value={input.name} onChange={(e) => patch({ name: e.target.value })} maxLength={40} autoComplete="given-name" />
            </div>
            <div className="flex items-end">
              <div className="w-full">
                <Stepper id="q-guests" label="Invités" value={input.guests} min={1} max={300} onChange={(n) => patch({ guests: n })} />
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="card-surface">
          <legend className="font-display text-xl font-semibold">3. Chambres (optionnel)</legend>
          <div className="mt-4 space-y-4">
            {rooms.map((room) => (
              <Stepper
                key={room.id}
                id={`q-room-${room.id}`}
                label={room.name}
                hint={`${formatAr(room.price)} / nuit`}
                value={input.rooms[room.id] ?? 0}
                onChange={(n) => patch({ rooms: { ...input.rooms, [room.id]: n } })}
                max={20}
              />
            ))}
            <div className="border-t border-slate-100 pt-4">
              <Stepper id="q-nights" label="Nombre de nuits" value={input.nights} min={1} max={14} onChange={(n) => patch({ nights: n })} />
            </div>
          </div>
        </fieldset>

        <fieldset className="card-surface">
          <legend className="font-display text-xl font-semibold">4. Repas sur commande (optionnel)</legend>
          <p className="mt-2 text-xs text-slate-500">Vous pouvez aussi apporter votre nourriture : les boissons sont servies sur place.</p>
          <div className="mt-4 space-y-4">
            <Stepper id="q-plat1" label="Plat du jour" hint={`${formatAr(prices.meals.platDuJour)} / personne`} value={input.meals.platDuJour} max={300} onChange={(n) => patch({ meals: { ...input.meals, platDuJour: n } })} />
            <Stepper id="q-plat2" label="Plat complet (entrée, plat, dessert)" hint={`${formatAr(prices.meals.platComplet)} / personne`} value={input.meals.platComplet} max={300} onChange={(n) => patch({ meals: { ...input.meals, platComplet: n } })} />
          </div>
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-24" aria-label="Récapitulatif de votre estimation">
        <div className="rounded-3xl bg-[#2B211B] p-6 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FDBA74]">Votre estimation</p>
          <ul className="mt-4 space-y-2 text-sm">
            {quote.lines.length === 0 && <li className="text-white/60">Choisissez une formule pour voir le prix.</li>}
            {quote.lines.map((line) => (
              <li key={line.label} className="flex justify-between gap-4">
                <span className="text-white/80">{line.label}</span>
                <span className="shrink-0 font-semibold">{formatAr(line.amount)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-baseline justify-between border-t border-white/15 pt-4">
            <span className="text-sm text-white/70">Total estimé</span>
            <span className="font-display text-3xl font-semibold" aria-live="polite">{formatAr(quote.total)}</span>
          </div>
          {quote.warnings.map((w) => (
            <p key={w} className="mt-3 rounded-xl bg-[#C2410C]/30 p-3 text-xs leading-snug text-[#FED7AA]">{w}</p>
          ))}
          <p className="mt-3 text-xs text-white/60">Estimation indicative et sans engagement : disponibilités et prix sont confirmés par l’équipe.</p>

          <div className="mt-5 space-y-3">
            <a
              href={hasTotal ? whatsappLink(message) : undefined}
              aria-disabled={!hasTotal}
              target="_blank"
              rel="noreferrer"
              className={`btn-primary w-full !bg-[#15803D] hover:!bg-[#166534] ${hasTotal ? '' : 'pointer-events-none opacity-50'}`}
            >
              <WhatsappIcon /> Envoyer sur WhatsApp
            </a>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={copyMessage} disabled={!hasTotal} className="btn-ghost-light !px-3 text-sm disabled:opacity-50">
                {copied ? 'Copié ✓' : 'Copier le résumé'}
              </button>
              <a href={business.messengerUrl} target="_blank" rel="noreferrer" className="btn-ghost-light !px-3 text-sm">
                <MessengerIcon /> Messenger
              </a>
            </div>
            <p className="text-center text-xs text-white/50">Messenger : copiez le résumé puis collez-le dans la conversation.</p>
            <button type="button" onClick={() => setShowInvite((v) => !v)} className="btn-light w-full" aria-expanded={showInvite}>
              {showInvite ? 'Masquer la carte' : 'Créer ma carte d’invitation'}
            </button>
          </div>
        </div>
        {showInvite && <InvitationCard eventType={input.eventType} date={input.date} defaultHost={input.name} />}
      </aside>
    </div>
  )
}
