function HowItWorksStep({ icon: Icon, number, title, description }) {
  return (
    <div className="relative flex flex-1 flex-col items-start rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
        <Icon className="h-5 w-5" />
      </div>
      <span className="mb-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        Step {number}
      </span>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
    </div>
  )
}

export default HowItWorksStep
