import { memo } from 'react'

function AppointmentsCard({ title, appointments, accentClass, emptyMessage, type, onAction }) {
  const hasData = appointments.length > 0

  return (
    <section className="w-full max-w-full overflow-hidden rounded-xl bg-white p-5 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-medium text-white ${accentClass}`}>{appointments.length}</span>
      </div>

      <div className="mt-4 space-y-3">
        {!hasData ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            {emptyMessage}
          </div>
        ) : (
          appointments.map((appointment) => {
            const patientAge = appointment.patient?.patientProfile?.age ?? '—'
            const appointmentDate = new Date(appointment.date).toLocaleString()

            return (
              <article key={appointment.id} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:shadow-md">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-800">{appointment.patient.name}</h4>
                    {type === 'new' ? (
                      <div className="mt-1 space-y-1 text-sm text-slate-600">
                        <p>Age: {patientAge}</p>
                        <p>Symptoms: {appointment.patient?.patientProfile?.symptoms || '—'}</p>
                        <p>Date/Time: {appointmentDate}</p>
                        {appointment.appointmentType && (
                          <div className="mt-2">
                            <span
                              className={`inline-block rounded-md px-2 py-1 text-xs font-medium text-white ${
                                appointment.appointmentType === 'physical' ? 'bg-emerald-600' : 'bg-blue-600'
                              }`}
                            >
                              {appointment.appointmentType === 'physical' ? 'Physical Appointment' : 'Online Appointment'}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 space-y-1 text-sm text-slate-600">
                        <p>Date: {appointmentDate}</p>
                        <p>Status: {appointment.status}</p>
                        {appointment.appointmentType && (
                          <div className="mt-2">
                            <span
                              className={`inline-block rounded-md px-2 py-1 text-xs font-medium text-white ${
                                appointment.appointmentType === 'physical' ? 'bg-emerald-600' : 'bg-blue-600'
                              }`}
                            >
                              {appointment.appointmentType === 'physical' ? 'Physical Appointment' : 'Online Appointment'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {type === 'new' ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onAction(appointment.id, 'accepted')}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => onAction(appointment.id, 'rejected')}
                        className="rounded-xl bg-red-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}

export default memo(AppointmentsCard)
