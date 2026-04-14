import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowRight, FiCalendar, FiClock } from 'react-icons/fi'

function AppointmentDashboardCard({ appointments = [], loading = false }) {
  const navigate = useNavigate()

  const { upcomingCount, nextAppointment } = useMemo(() => {
    const now = Date.now()
    const upcoming = appointments.filter((item) => {
      if (!['pending', 'accepted'].includes(item.status)) {
        return false
      }
      const appointmentTime = new Date(item.date).getTime()
      return Number.isFinite(appointmentTime) ? appointmentTime > now : false
    })

    const sorted = upcoming.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    return {
      upcomingCount: upcoming.length,
      nextAppointment: sorted[0] || null,
    }
  }, [appointments])

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      onClick={() => navigate('/patient/appointments')}
      className="group cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-lg sm:p-6"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Appointments</h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-transform group-hover:scale-110">
          <FiCalendar className="h-6 w-6" />
        </div>
      </div>

      {/* Next Appointment Preview */}
      {nextAppointment ? (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Next Appointment</p>
            <p className="mt-1 font-semibold text-slate-900">
              {nextAppointment.doctor?.fullName || 'Doctor'}
            </p>
            <p className="text-sm text-slate-600">
              {nextAppointment.doctor?.specialization || 'Specialist'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <FiCalendar className="h-4 w-4 shrink-0" />
              <span>{formatDate(nextAppointment.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiClock className="h-4 w-4 shrink-0" />
              <span>{formatTime(nextAppointment.date)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-slate-100 pt-4 text-center text-sm text-slate-600">
          No upcoming appointments
        </div>
      )}

      {/* View All Link */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-medium text-blue-600 transition-colors group-hover:text-blue-700">
        <span>View all appointments</span>
        <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  )
}

export default AppointmentDashboardCard
