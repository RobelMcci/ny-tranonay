/** Bandeau défilant (CSS pur, pause au survol). Le 2ᵉ exemplaire est masqué aux lecteurs d'écran. */
export default function Marquee({ items, reverse = false, outline = false, className = '' }) {
  const loop = [...items, ...items]
  return (
    <div className={`marquee-wrap overflow-hidden ${className}`}>
      <ul className={`flex w-max items-center ${reverse ? 'marquee-rev' : 'marquee'}`}>
        {loop.map((item, i) => (
          <li key={`${item}-${i}`} aria-hidden={i >= items.length} className="flex items-center">
            <span className={`font-display text-4xl font-semibold sm:text-6xl ${outline ? 'text-outline' : ''}`}>{item}</span>
            <span aria-hidden="true" className="mx-6 text-2xl text-[#D97706] sm:mx-10 sm:text-4xl">✦</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
