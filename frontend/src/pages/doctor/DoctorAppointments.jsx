import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDoctorAppointmentsApi, updateAppointmentStatusApi } from '../../services/appointment.service'

function getStatusClasses(status) {
  const base = 'rounded-full px-3 py-1 text-xs font-medium capitalize'
  if (status === 'accepted') return `${base} bg-emerald-50 text-emerald-700`
  if (status === 'rejected') return `${base} bg-red-50 text-red-700`
  if (status === 'completed') return `${base} bg-sky-50 text-sky-700`
  return `${base} bg-amber-50 text-amber-700`
}

function DoctorAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortOrder, setSortOrder] = useState('latest')
  const hasLoadedRef = useRef(false)

  const loadAppointments = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getDoctorAppointmentsApi()
      setAppointments(response.data)
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    loadAppointments()
  }, [])

  const filteredAppointments = useMemo(() => {
    const items = appointments.filter((appointment) => {
      if (selectedStatus === 'all') return true
      return appointment.status === selectedStatus
    })

    return [...items].sort((a, b) => {
      const left = new Date(a.date).getTime()
      const right = new Date(b.date).getTime()
      return sortOrder === 'latest' ? right - left : left - right
    })
  }, [appointments, selectedStatus, sortOrder])

  const changeStatus = async (id, status) => {
    setActionLoadingId(id)
    setError('')

    try {
      await updateAppointmentStatusApi(id, status)
      await loadAppointments()
    } catch (statusError) {
      setError(statusError?.response?.data?.message || 'Failed to update appointment status')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <h2 className="text-2xl font-semibold text-slate-800">Doctor Appointments</h2>
        <p className="mt-1 text-sm text-slate-500">Review and manage incoming appointment requests.</p>

        <section className="mt-6 rounded-xl bg-white p-4 shadow-md sm:p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            >
              <option value="latest">Sort by Latest</option>
              <option value="oldest">Sort by Oldest</option>
            </select>
          </div>
        </section>

        {loading ? (
          <div className="mt-8 flex items-center justify-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
          </div>
        ) : null}

        {error ? <p className="mt-6 text-sm text-red-500">{error}</p> : null}

        {!loading && filteredAppointments.length === 0 ? (
          <p className="mt-8 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-md">
            No appointments found.
          </p>
        ) : null}

        <section className="mt-6 grid gap-4">
          {filteredAppointments.map((appointment) => {
            const symptoms = appointment.patient?.patientProfile?.symptoms || 'No symptoms provided'
            const canAcceptOrReject = appointment.status === 'pending'
            const canComplete = appointment.status === 'accepted'
            const canChat = appointment.status !== 'rejected'

            return (
              <article key={appointment.id} className="rounded-xl bg-white p-5 shadow-md">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{appointment.patient.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{appointment.patient.email}</p>
                    <p className="mt-2 text-sm text-slate-600">Symptoms: {symptoms}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Date: {new Date(appointment.date).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <span className={getStatusClasses(appointment.status)}>{appointment.status}</span>
                    <div className="flex flex-wrap gap-2">
                      {canChat ? (
                        <Link
                          to={`/chat/${appointment.id}`}
                          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
                        >
                          Open Chat
                        </Link>
                      ) : null}
                      <button
                        onClick={() => changeStatus(appointment.id, 'accepted')}
                        disabled={!canAcceptOrReject || actionLoadingId === appointment.id}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => changeStatus(appointment.id, 'rejected')}
                        disabled={!canAcceptOrReject || actionLoadingId === appointment.id}
                        className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => changeStatus(appointment.id, 'completed')}
                        disabled={!canComplete || actionLoadingId === appointment.id}
                        className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Mark Completed
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      </main>
    </div>
  )
}

export default DoctorAppointments
