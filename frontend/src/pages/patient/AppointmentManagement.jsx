import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import {
  cancelAppointmentApi,
  getPatientAppointmentsApi,
  rescheduleAppointmentApi,
} from '../../services/appointment.service'
import { getMessagesApi } from '../../services/message.service'
import {
  isAppointmentCompletedForView,
  isAppointmentUpcomingForView,
  isAppointmentVideoActive,
} from '../../utils/appointmentTime'
import { FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiVideo, FiX } from 'react-icons/fi'

const PATIENT_APPOINTMENT_HISTORY_KEY = 'patientAppointmentHistory'
const PATIENT_VISITED_CHAT_KEY = 'patientVisitedAppointmentChats'

function getHistoryStorageKey(user) {
  const identifier = user?.id || user?.email || user?.name || 'anonymous'
  return `${PATIENT_APPOINTMENT_HISTORY_KEY}_${identifier}`
}

function getStoredHistory(user) {
  try {
    const parsed = JSON.parse(localStorage.getItem(getHistoryStorageKey(user)) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch (_error) {
    return []
  }
}

function getChatVisitStorageKey(user) {
  const identifier = user?.id || user?.email || user?.name || 'anonymous'
  return `${PATIENT_VISITED_CHAT_KEY}_${identifier}`
}

function getStoredVisitedChats(user) {
  try {
    const parsed = JSON.parse(localStorage.getItem(getChatVisitStorageKey(user)) || '[]')
    return Array.isArray(parsed) ? parsed.filter((id) => Number.isInteger(id) && id > 0) : []
  } catch (_error) {
    return []
  }
}

function isUpcomingAppointment(appointment, now = Date.now()) {
  return isAppointmentUpcomingForView(appointment, now)
}

function isCompletedAppointment(appointment, now = Date.now()) {
  return isAppointmentCompletedForView(appointment, now)
}

function AppointmentManagement() {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [appointmentHistory, setAppointmentHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [cancelConfirmId, setCancelConfirmId] = useState(null)
  const [rescheduleOpenId, setRescheduleOpenId] = useState(null)
  const [rescheduleValues, setRescheduleValues] = useState({})
  const [showCancelModal, setShowCancelModal] = useState(null)
  const [showRescheduleModal, setShowRescheduleModal] = useState(null)
  const [visitedChats, setVisitedChats] = useState([])
  const [chatPreviewAppointment, setChatPreviewAppointment] = useState(null)
  const [chatPreviewMessages, setChatPreviewMessages] = useState([])
  const [chatPreviewLoading, setChatPreviewLoading] = useState(false)
  const [chatPreviewError, setChatPreviewError] = useState('')
  const [chatPreviewCanContinue, setChatPreviewCanContinue] = useState(false)
  const hasLoadedAppointmentsRef = useRef(false)

  const persistHistory = (nextHistory) => {
    setAppointmentHistory(nextHistory)
    localStorage.setItem(getHistoryStorageKey(user), JSON.stringify(nextHistory))
  }

  const persistVisitedChats = (nextVisitedIds) => {
    setVisitedChats(nextVisitedIds)
    localStorage.setItem(getChatVisitStorageKey(user), JSON.stringify(nextVisitedIds))
  }

  const mergeIntoHistory = (incomingAppointments = []) => {
    const existingHistory = getStoredHistory(user)
    const byId = new Map(existingHistory.map((item) => [item.id, item]))

    incomingAppointments.forEach((item) => {
      const previous = byId.get(item.id)
      byId.set(item.id, {
        ...(previous || {}),
        ...item,
      })
    })

    const nextHistory = [...byId.values()].sort(
      (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
    )

    persistHistory(nextHistory)
  }

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const response = await getPatientAppointmentsApi()
      const nextAppointments = response.data || []
      setAppointments(nextAppointments)
      mergeIntoHistory(nextAppointments)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasLoadedAppointmentsRef.current) return
    hasLoadedAppointmentsRef.current = true

    setAppointmentHistory(getStoredHistory(user))
    setVisitedChats(getStoredVisitedChats(user))
    loadAppointments()
  }, [user?.id])

  // Separate upcoming and completed appointments
  const { upcomingAppointments, completedAppointments } = useMemo(() => {
    const now = Date.now()
    const upcoming = appointments.filter((item) => isUpcomingAppointment(item, now))

    const currentCompleted = appointments.filter((item) => isCompletedAppointment(item, now))

    const currentIds = new Set(appointments.map((item) => item.id))
    const historyOnlyCompleted = appointmentHistory.filter(
      (item) => !currentIds.has(item.id) && isCompletedAppointment(item, now),
    )

    const completed = [...currentCompleted, ...historyOnlyCompleted]
      .reduce((accumulator, item) => {
        if (!accumulator.some((entry) => entry.id === item.id)) {
          accumulator.push(item)
        }
        return accumulator
      }, [])

    return {
      upcomingAppointments: upcoming.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
      completedAppointments: completed.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    }
  }, [appointments, appointmentHistory])

  const handleCancelClick = (id) => {
    setShowCancelModal(id)
  }

  const confirmCancelAppointment = async () => {
    if (!showCancelModal) return

    setActionLoadingId(showCancelModal)
    try {
      await cancelAppointmentApi(showCancelModal)
      setShowCancelModal(null)
      await loadAppointments()
      toast.success('Appointment cancelled successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to cancel appointment')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRescheduleClick = (id) => {
    setShowRescheduleModal(id)
    setRescheduleOpenId(id)
  }

  const handleRescheduleSubmit = async () => {
    if (!showRescheduleModal) return

    const newDate = rescheduleValues[showRescheduleModal]
    if (!newDate) {
      toast.error('Please select a new date and time')
      return
    }

    setActionLoadingId(showRescheduleModal)
    try {
      await rescheduleAppointmentApi(showRescheduleModal, new Date(newDate).toISOString())
      setRescheduleValues((prev) => ({ ...prev, [showRescheduleModal]: '' }))
      setShowRescheduleModal(null)
      setRescheduleOpenId(null)
      await loadAppointments()
      toast.success('Appointment rescheduled successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to reschedule appointment')
    } finally {
      setActionLoadingId(null)
    }
  }

  const formatAppointmentDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatAppointmentTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleOpenChat = async (appointment) => {
    const nextVisited = visitedChats.includes(appointment.id)
      ? visitedChats
      : [...visitedChats, appointment.id]

    if (nextVisited !== visitedChats) {
      persistVisitedChats(nextVisited)
    }

    navigate(`/chat/${appointment.id}`)
  }

  const handleOpenVideoConsultation = (appointment) => {
    navigate(`/consultation/${appointment.id}`)
  }

  const hasVisitedAppointmentChat = (appointmentId) => {
    return visitedChats.includes(appointmentId)
  }

  const handleOpenChatPreview = async (appointment, canContinue = false) => {
    setChatPreviewAppointment(appointment)
    setChatPreviewMessages([])
    setChatPreviewError('')
    setChatPreviewCanContinue(canContinue)
    setChatPreviewLoading(true)

    try {
      const response = await getMessagesApi(appointment.id)
      setChatPreviewMessages(response.data || [])
    } catch (error) {
      setChatPreviewError(error?.response?.data?.message || 'Failed to load chat messages')
    } finally {
      setChatPreviewLoading(false)
    }
  }

  const AppointmentCard = ({ appointment, isCompleted }) => (
    <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6 shadow-sm transition-shadow hover:shadow-md">
      {/* Header with doctor name and status */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900">
            {appointment.doctor?.fullName || 'Doctor'}
          </h3>
          <p className="text-sm text-slate-600">
            {appointment.doctor?.specialization || 'Specialist'}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
            isCompleted
              ? 'bg-blue-50 text-blue-700'
              : appointment.status === 'accepted'
                ? 'bg-green-50 text-green-700'
                : 'bg-amber-50 text-amber-700'
          }`}
        >
          {isCompleted ? 'Completed' : appointment.status}
        </span>
      </div>

      {/* Appointment Type Badge */}
      {appointment.appointmentType && (
        <div className="mb-4 flex gap-2">
          <span
            className={`inline-block rounded-md px-2 py-1 text-xs font-medium text-white ${
              appointment.appointmentType === 'physical' ? 'bg-emerald-600' : 'bg-blue-600'
            }`}
          >
            {appointment.appointmentType === 'physical' ? 'Physical Appointment' : 'Online Appointment'}
          </span>
        </div>
      )}

      {/* Appointment details */}
      <div className="space-y-3 border-t border-slate-100 pt-4">
        {/* Date */}
        <div className="flex items-center gap-3 text-slate-700">
          <FiCalendar className="h-5 w-5 shrink-0 text-slate-400" />
          <span className="text-sm sm:text-base">{formatAppointmentDate(appointment.date)}</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-3 text-slate-700">
          <FiClock className="h-5 w-5 shrink-0 text-slate-400" />
          <span className="text-sm sm:text-base">{formatAppointmentTime(appointment.date)}</span>
        </div>

        {/* Hospital/Location - Only for physical appointments */}
        {appointment.appointmentType === 'physical' && appointment.doctor?.hospitalName && (
          <div className="flex items-center gap-3 text-slate-700">
            <FiMapPin className="h-5 w-5 shrink-0 text-slate-400" />
            <span className="text-sm sm:text-base">
              Meet the doctor at {appointment.doctor.hospitalName}
            </span>
          </div>
        )}

        {!isCompleted && appointment.appointmentType === 'online' ? (
          <p className="pt-1 text-xs font-medium text-slate-500">
            {appointment.status === 'accepted'
              ? 'Appointment accepted. You can now chat with doctor.'
              : 'Chat will be available after doctor accepts this appointment.'}
          </p>
        ) : null}
      </div>

      {/* Action buttons - only for upcoming appointments */}
      {!isCompleted && (
        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
          <button
            onClick={() => handleRescheduleClick(appointment.id)}
            disabled={actionLoadingId === appointment.id}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 sm:text-base"
          >
            {actionLoadingId === appointment.id ? 'Processing...' : 'Reschedule'}
          </button>
          <button
            onClick={() => handleCancelClick(appointment.id)}
            disabled={actionLoadingId === appointment.id}
            className="flex-1 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 sm:text-base"
          >
            {actionLoadingId === appointment.id ? 'Processing...' : 'Cancel'}
          </button>
        </div>
      )}

      {!isCompleted && appointment.appointmentType === 'online' && appointment.status === 'accepted' ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {hasVisitedAppointmentChat(appointment.id) ? (
              <button
                type="button"
                onClick={() => handleOpenChatPreview(appointment, true)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:text-base"
              >
                View Previous Chat
              </button>
            ) : null}
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => handleOpenChat(appointment)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:text-base"
              >
                Chat with Doctor
              </button>
              {isAppointmentVideoActive(appointment) ? (
                <button
                  type="button"
                  onClick={() => handleOpenVideoConsultation(appointment)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 sm:text-base"
                >
                  <FiVideo className="h-4 w-4" />
                  Video Consultation
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isCompleted && appointment.appointmentType === 'online' ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => handleOpenChatPreview(appointment, false)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:text-base"
          >
            View Previous Chat
          </button>
        </div>
      ) : null}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="rounded-lg bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">Loading appointments...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate('/patient/dashboard')}
            className="flex items-center justify-center rounded-lg bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50"
          >
            <FiArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Appointments</h1>
            <p className="text-slate-600">Manage your upcoming and completed appointments</p>
          </div>
        </div>

        {/* Upcoming Appointments Section */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              Upcoming Appointments
              <span className="ml-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                {upcomingAppointments.length}
              </span>
            </h2>
          </div>

          {upcomingAppointments.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} isCompleted={false} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white p-8 text-center shadow-sm">
              <p className="mb-4 text-slate-600">No upcoming appointments</p>
              <button
                onClick={() => navigate('/book-appointment')}
                className="inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Book an Appointment
              </button>
            </div>
          )}
        </div>

        {/* Completed Appointments Section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              Completed Appointments
              <span className="ml-2 inline-block rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-700">
                {completedAppointments.length}
              </span>
            </h2>
          </div>

          {completedAppointments.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {completedAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} isCompleted={true} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white p-8 text-center shadow-sm">
              <p className="text-slate-600">No completed appointments yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-sm rounded-lg border border-slate-100 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Cancel Appointment?</h3>
            <p className="mt-2 text-slate-600">
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCancelModal(null)}
                disabled={actionLoadingId === showCancelModal}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Keep Appointment
              </button>
              <button
                onClick={confirmCancelAppointment}
                disabled={actionLoadingId === showCancelModal}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoadingId === showCancelModal ? 'Cancelling...' : 'Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-sm rounded-lg border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Reschedule Appointment</h3>
              <button
                onClick={() => {
                  setShowRescheduleModal(null)
                  setRescheduleOpenId(null)
                  setRescheduleValues((prev) => ({ ...prev, [showRescheduleModal]: '' }))
                }}
                className="text-slate-400 transition-colors hover:text-slate-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700">New Date & Time</label>
              <input
                type="datetime-local"
                value={rescheduleValues[showRescheduleModal] || ''}
                onChange={(e) =>
                  setRescheduleValues((prev) => ({
                    ...prev,
                    [showRescheduleModal]: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRescheduleModal(null)
                  setRescheduleOpenId(null)
                  setRescheduleValues((prev) => ({ ...prev, [showRescheduleModal]: '' }))
                }}
                disabled={actionLoadingId === showRescheduleModal}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleSubmit}
                disabled={actionLoadingId === showRescheduleModal || !rescheduleValues[showRescheduleModal]}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoadingId === showRescheduleModal ? 'Rescheduling...' : 'Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {chatPreviewAppointment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-2xl rounded-lg border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Chat with {chatPreviewAppointment.doctor?.fullName || 'Doctor'}
                </h3>
                <p className="text-sm text-slate-500">
                  Appointment on {formatAppointmentDate(chatPreviewAppointment.date)} at{' '}
                  {formatAppointmentTime(chatPreviewAppointment.date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChatPreviewAppointment(null)}
                className="text-slate-400 transition-colors hover:text-slate-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-96 min-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
              {chatPreviewLoading ? (
                <p className="text-sm text-slate-500">Loading chat...</p>
              ) : chatPreviewError ? (
                <p className="text-sm text-red-500">{chatPreviewError}</p>
              ) : chatPreviewMessages.length === 0 ? (
                <p className="text-sm text-slate-500">No messages for this appointment yet.</p>
              ) : (
                <div className="space-y-3">
                  {chatPreviewMessages.map((message) => {
                    const isOwn = message.senderId === user?.id
                    return (
                      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-xl px-3 py-2 text-sm shadow-sm ${
                            isOwn
                              ? 'bg-blue-600 text-white'
                              : 'border border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          <p className="wrap-break-word">{message.message}</p>
                          <p className={`mt-1 text-[11px] ${isOwn ? 'text-blue-100' : 'text-slate-400'}`}>
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setChatPreviewAppointment(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Close
              </button>
              {chatPreviewCanContinue ? (
                <button
                  type="button"
                  onClick={() => {
                    const appointmentId = chatPreviewAppointment.id
                    setChatPreviewAppointment(null)
                    navigate(`/chat/${appointmentId}`)
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Continue this Chat
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AppointmentManagement
