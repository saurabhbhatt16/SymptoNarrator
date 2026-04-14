import { useEffect, useMemo, useState } from 'react'
import { HiChevronLeft, HiChevronRight, HiStar } from 'react-icons/hi'

function TestimonialsSlider({ testimonials }) {
  const [index, setIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(3)

  const looped = useMemo(() => {
    if (testimonials.length < visibleCount) return testimonials
    return testimonials
  }, [testimonials])

  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth < 640) {
        setVisibleCount(1)
        return
      }

      if (window.innerWidth < 1024) {
        setVisibleCount(2)
        return
      }

      setVisibleCount(3)
    }

    updateVisibleCount()
    window.addEventListener('resize', updateVisibleCount)
    return () => window.removeEventListener('resize', updateVisibleCount)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % looped.length)
    }, 4500)

    return () => clearInterval(timer)
  }, [looped.length])

  const getVisibleCards = () => {
    return Array.from({ length: visibleCount }, (_, offset) => {
      const itemIndex = (index + offset) % looped.length
      return looped[itemIndex]
    })
  }

  const cards = getVisibleCards()

  return (
    <div className="mt-10">
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setIndex((prev) => (prev - 1 + looped.length) % looped.length)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
          aria-label="Previous testimonials"
        >
          <HiChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setIndex((prev) => (prev + 1) % looped.length)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
          aria-label="Next testimonials"
        >
          <HiChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((item) => (
          <article
            key={`${item.id}-${index}`}
            className="animate-[fadeSlide_450ms_ease-out] rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition duration-300 hover:shadow-lg"
          >
            <div className="mb-3 flex items-center gap-1 text-amber-400">
              {Array.from({ length: item.rating }).map((_, starIndex) => (
                <HiStar key={starIndex} className="h-4 w-4" />
              ))}
            </div>
            <p className="text-sm leading-relaxed text-slate-600">{item.feedback}</p>
            <p className="mt-4 text-sm font-semibold text-slate-800">{item.name}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

export default TestimonialsSlider
