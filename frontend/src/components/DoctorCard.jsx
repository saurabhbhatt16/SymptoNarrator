import { Link } from 'react-router-dom'

function DoctorCard({ doctor }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{doctor.fullName}</h3>
          <p className="mt-1 text-sm text-sky-700">{doctor.specialization}</p>
        </div>
        {doctor.verified ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Verified
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-1 text-sm text-slate-600">
        <p>Experience: {doctor.experience} years</p>
        <p>Hospital: {doctor.hospital}</p>
        <p>Consultation Fee: Rs {doctor.consultationFee}</p>
      </div>

      <div className="mt-5 flex gap-3">
        <Link
          to="/book-appointment"
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
        >
          Book Appointment
        </Link>
        <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
          View Profile
        </button>
      </div>
    </article>
  )
}

export default DoctorCard
