import { motion } from 'framer-motion'

function TestimonialsCarousel({ testimonials, activeIndex, onIndexChange }) {
  const total = testimonials.length
  const active = testimonials[activeIndex] || testimonials[0]

  const goPrev = () => onIndexChange((activeIndex - 1 + total) % total)
  const goNext = () => onIndexChange((activeIndex + 1) % total)

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
      <motion.div
        key={active?.name}
        className="rounded-3xl bg-gradient-to-br from-[#DC2626] via-[#DC2626] to-[#10B981] p-8 text-white shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-1 text-lg">
          {Array.from({ length: active?.rating || 5 }).map((_, index) => (
            <span key={index}>★</span>
          ))}
        </div>
        <p className="mt-6 text-2xl font-semibold">“{active?.quote}”</p>
        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">{active?.name}</p>
            <p className="text-sm text-white/80">{active?.role}</p>
          </div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs">{active?.date}</span>
        </div>
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={goPrev}
            className="rounded-full border border-white/60 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-[#DC2626]"
          >
            ← Précédent
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#DC2626] transition hover:opacity-90"
          >
            Suivant →
          </button>
        </div>
      </motion.div>

      <div className="flex flex-col gap-4">
        {testimonials.map((item, index) => (
          <button
            key={item.name}
            type="button"
            onClick={() => onIndexChange(index)}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              index === activeIndex
                ? 'border-[#DC2626] bg-white shadow-lg'
                : 'border-slate-200 bg-white/60 hover:border-[#10B981]'
            }`}
          >
            <p className="text-sm font-semibold text-slate-900">{item.name}</p>
            <p className="text-xs text-slate-500">{item.role}</p>
            <p className="mt-2 text-xs text-slate-600">{item.quote}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default TestimonialsCarousel
