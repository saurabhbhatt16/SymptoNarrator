import { HiX } from 'react-icons/hi'

function ServiceModal({ service, onClose }) {
  if (!service) return null

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/45 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close modal"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <HiX className="h-5 w-5" />
        </button>

        <h3 className="pr-10 text-2xl font-bold text-slate-800">{service.title}</h3>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">{service.details}</p>

        <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-700">Example Workflow</p>
          <p className="mt-2 text-sm leading-relaxed text-emerald-800">{service.workflow}</p>
        </div>
      </div>
    </div>
  )
}

export default ServiceModal
