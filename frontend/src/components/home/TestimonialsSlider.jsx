import { useEffect, useMemo, useState } from 'react'
import { HiChevronLeft, HiChevronRight, HiStar } from 'react-icons/hi'

function TestimonialsSlider({ testimonials }) {
  const [index, setIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(3)

  const looped = useMemo(() => testimonials, [testimonials])
  const maxStartIndex = Math.max(0, looped.length - visibleCount)

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
    setIndex(0)
  }, [visibleCount])

  useEffect(() => {
    if (!looped.length) return undefined

    const timer = setInterval(() => {
      setIndex((prev) => (prev >= maxStartIndex ? 0 : prev + 1))
    }, 6500)

    return () => clearInterval(timer)
  }, [looped.length, maxStartIndex])

  const handlePrevious = () => {
    setIndex((prev) => (prev === 0 ? maxStartIndex : prev - 1))
  }

  const handleNext = () => {
    setIndex((prev) => (prev >= maxStartIndex ? 0 : prev + 1))
  }

  const trackWidth = `${(looped.length * 100) / visibleCount}%`
  const itemWidth = `${100 / looped.length}%`
  const translateValue = `${-(index * (100 / looped.length))}%`

  return (
    <div className="mt-10">
      <div className="flex items-center gap-3 lg:gap-5">
        <button
          type="button"
          onClick={handlePrevious}
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-sky-200 hover:text-sky-700 hover:shadow-md md:inline-flex"
          aria-label="Previous testimonials"
        >
          <HiChevronLeft className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1 overflow-hidden rounded-3xl">
          <div
            className="flex transition-transform duration-1000 ease-in-out"
            style={{ width: trackWidth, transform: `translateX(${translateValue})` }}
          >
            {looped.map((item, itemIndex) => (
              <div
                key={`${item.id}-${itemIndex}`}
                className="px-2"
                style={{ width: itemWidth }}
              >
                <article className="h-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition duration-300 hover:shadow-lg">
                  <div className="mb-3 flex items-center gap-1 text-amber-400">
                    {Array.from({ length: item.rating }).map((_, starIndex) => (
                      <HiStar key={starIndex} className="h-4 w-4" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">{item.feedback}</p>
                  <p className="mt-4 text-sm font-semibold text-slate-800">{item.name}</p>
                </article>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-sky-200 hover:text-sky-700 hover:shadow-md md:inline-flex"
          aria-label="Next testimonials"
        >
          <HiChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 md:hidden">
        <button
          type="button"
          onClick={handlePrevious}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-sky-200 hover:text-sky-700"
          aria-label="Previous testimonials"
        >
          <HiChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-sky-200 hover:text-sky-700"
          aria-label="Next testimonials"
        >
          <HiChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export default TestimonialsSlider
