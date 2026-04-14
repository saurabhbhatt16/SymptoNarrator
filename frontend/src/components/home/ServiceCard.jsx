function ServiceCard({ icon: Icon, title, description, onLearnMore }) {
  return (
    <article className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition group-hover:bg-emerald-50 group-hover:text-emerald-600">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
      <button
        type="button"
        onClick={onLearnMore}
        className="mt-5 inline-flex items-center rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sky-100 hover:text-sky-700"
      >
        Learn More
      </button>
    </article>
  )
}

export default ServiceCard
