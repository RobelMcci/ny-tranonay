import { useRef } from 'react'
import { photos, roomPhotoKeys } from '../lib/images.js'
import Photo from './Photo.jsx'

/** Carrousel horizontal des chambres : défilement tactile, glisser à la souris et flèches. */
export default function RoomCarousel() {
  const track = useRef(null)
  const drag = useRef({ active: false, startX: 0, scroll: 0 })

  const scrollBy = (dir) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' })

  const onDown = (e) => {
    if (e.pointerType !== 'mouse') return
    drag.current = { active: true, startX: e.clientX, scroll: track.current.scrollLeft }
    track.current.style.scrollSnapType = 'none'
  }
  const onMove = (e) => {
    if (!drag.current.active) return
    track.current.scrollLeft = drag.current.scroll - (e.clientX - drag.current.startX)
  }
  const onUp = () => {
    if (!drag.current.active) return
    drag.current.active = false
    track.current.style.scrollSnapType = ''
  }

  const arrow = 'touch-target absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-2xl font-bold text-[#2B211B] shadow-xl transition hover:scale-110 md:flex'

  return (
    <div className="relative">
      <button type="button" className={`${arrow} left-2`} onClick={() => scrollBy(-1)} aria-label="Chambres précédentes">‹</button>
      <button type="button" className={`${arrow} right-2`} onClick={() => scrollBy(1)} aria-label="Chambres suivantes">›</button>
      <ul
        ref={track}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        className="flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 active:cursor-grabbing sm:px-6 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
        aria-label="Photos des chambres"
      >
        {roomPhotoKeys.map((key) => (
          <li key={key} className="w-[82%] shrink-0 snap-center sm:w-[46%] lg:w-[31%]">
            <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-slate-200 shadow-soft">
              <Photo name={key} sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 82vw" className="pointer-events-none h-full w-full select-none object-cover transition duration-700 hover:scale-105" />
            </div>
            <p className="mt-2 px-1 text-xs text-slate-600">{photos[key].alt}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
