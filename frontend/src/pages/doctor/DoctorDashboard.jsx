import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import ProfileSidebar from '../../components/doctor/ProfileSidebar'
import EditProfileModal from '../../components/doctor/EditProfileModal'
import AppointmentsCard from '../../components/doctor/AppointmentsCard'
import ChatRequestsCard from '../../components/doctor/ChatRequestsCard'
import Timetable, { DAYS, TIME_SLOTS } from '../../components/doctor/Timetable'
import { acceptAppointmentChatApi, updateAppointmentStatusApi } from '../../services/appointment.service'
import { getDoctorDashboardApi, updateDoctorProfileApi, updateDoctorTimetableApi } from '../../services/doctor.service'
import { isAppointmentCompletedForView } from '../../utils/appointmentTime'
import { logout } from '../../redux/authSlice'

function normalizeTimetableArray(value) {
  if (Array.isArray(value)) {
    return value.filter((slot) => slot?.day && slot?.timeSlot)
  }

  if (value && typeof value === 'object') {
    const rows = []
    for (const [day, slots] of Object.entries(value)) {
      if (Array.isArray(slots)) {
        slots.forEach((slot) => {
          if (slot?.time) {
            rows.push({ day, timeSlot: slot.time, isAvailable: Boolean(slot.available) })
          }
        })
      } else if (slots && typeof slots === 'object') {
        Object.entries(slots).forEach(([time, available]) => {
          rows.push({ day, timeSlot: time, isAvailable: Boolean(available) })
        })
      }
    }
    return rows
  }

  return []
}

function createInitialTimetable() {
  return DAYS.flatMap((day) => TIME_SLOTS.map((timeSlot) => ({ day, timeSlot, isAvailable: false })))
}

function isSameJson(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null)
}

function isSameArray(left = [], right = []) {
  if (left === right) return true
  if (!Array.isArray(left) || !Array.isArray(right)) return false
  if (left.length !== right.length) return false
  return left.every((item, index) => JSON.stringify(item) === JSON.stringify(right[index]))
}

function DoctorDashboard() {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTimetable, setEditingTimetable] = useState(false)
  const [timetable, setTimetable] = useState(createInitialTimetable)
  const [savedTimetable, setSavedTimetable] = useState(createInitialTimetable)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const hasLoadedRef = useRef(false)

  const chatRequests = useMemo(
    () => appointments.filter((appointment) => appointment.appointmentType === 'online' && appointment.chatStatus === 'requested'),
    [appointments],
  )

  const newAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'pending'),
    [appointments],
  )

  const completedAppointments = useMemo(
    () => appointments.filter((appointment) => isAppointmentCompletedForView(appointment, Date.now())),
    [appointments],
  )

  const timetableView = useMemo(() => timetable, [timetable])

  const displayName = (profile?.fullName || user?.name || 'Doctor')
    .trim()
    .replace(/^dr\.?\s+/i, '')
    .replace(/\s+/g, ' ')

  const loadDashboard = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
    }
    setError('')

    try {
      const dashboardResponse = await getDoctorDashboardApi()
      const nextProfile = dashboardResponse.profile || dashboardResponse.doctor || dashboardResponse
      const nextAppointments = dashboardResponse.appointments || []
      const apiRows = normalizeTimetableArray(dashboardResponse.timetable || [])
      const timetableRows = apiRows.length > 0 ? apiRows : createInitialTimetable()

      if (!isSameJson(profile, nextProfile)) {
        setProfile(nextProfile)
      }
      if (!isSameArray(appointments, nextAppointments)) {
        setAppointments(nextAppointments)
      }
      if (!isSameArray(timetable, timetableRows)) {
        setTimetable(timetableRows)
      }
      if (!isSameArray(savedTimetable, timetableRows)) {
        setSavedTimetable(timetableRows)
      }
    } catch (requestError) {
      const status = requestError?.response?.status
      if (status === 403 || status === 401) {
        dispatch(logout())
        navigate('/login')
        toast.error('Session expired. Please log in again.')
        return
      }

      setError(requestError?.response?.data?.message || 'Failed to load doctor dashboard')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    loadDashboard()
  }, [])

  const handleAppointmentAction = async (id, status) => {
    setActionLoadingId(id)
    setError('')

    try {
      await updateAppointmentStatusApi(id, status)
      toast.success(`Appointment ${status}`)
      await loadDashboard({ silent: true })
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update appointment status'
      setError(message)
      toast.error(message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const response = await updateDoctorProfileApi({
          name: profile.fullName || user?.name || 'Doctor',
          age: profile.age ?? null,
          gender: profile.gender || '',
          specialization: profile.specialization,
          education: profile.education || '',
          phone: profile.phone || '',
          profileImage: String(reader.result || ''),
          weeklyAvailability: profile.weeklyAvailability || null,
        })
        if (!isSameJson(profile, response.profile)) {
          setProfile(response.profile)
        }
        toast.success('Profile image updated')
      } catch (err) {
        const details = err?.response?.data?.details
        const message = Array.isArray(details)
          ? details[0]
          : err?.response?.data?.message || 'Failed to upload image'
        toast.error(message)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async (form) => {
    try {
      const response = await updateDoctorProfileApi({
        name: form.name,
        age: form.age === '' ? null : Number(form.age),
        gender: form.gender || '',
        specialization: form.specialization,
        education: form.education,
        phone: form.phone,
        profileImage: form.profileImage,
        weeklyAvailability: profile?.weeklyAvailability || null,
      })

      await updateDoctorTimetableApi(timetable)

      if (!isSameJson(profile, response.profile)) {
        setProfile(response.profile)
      }

      setIsEditOpen(false)
      toast.success('Profile updated successfully')
    } catch (err) {
      const details = err?.response?.data?.details
      const message = Array.isArray(details)
        ? details[0]
        : err?.response?.data?.message || 'Failed to update profile'
      toast.error(message)
    }
  }

  const handleTimetableToggle = (day, hour) => {
    if (!editingTimetable) return
    setTimetable((current) => {
      const index = current.findIndex((slot) => slot.day === day && slot.timeSlot === hour)

      if (index >= 0) {
        return current.map((slot, slotIndex) =>
          slotIndex === index ? { ...slot, isAvailable: !slot.isAvailable } : slot,
        )
      }

      return [...current, { day, timeSlot: hour, isAvailable: true }]
    })
  }

  const handleTimetableEditToggle = () => {
    if (editingTimetable) {
      setTimetable(savedTimetable)
    }
    setEditingTimetable((current) => !current)
  }

  const handleSaveTimetable = async () => {
    if (!profile) return

    try {
      const response = await updateDoctorTimetableApi(timetable)
      const nextTimetable = Array.isArray(response.timetable) ? response.timetable : timetable
      if (!isSameArray(savedTimetable, nextTimetable)) {
        setSavedTimetable(nextTimetable)
      }
      setTimetable(nextTimetable)
      setEditingTimetable(false)
      await loadDashboard({ silent: true })
      toast.success('Timetable saved successfully')
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to save timetable'
      toast.error(message)
      setTimetable(savedTimetable)
    }
  }

  const handleAcceptChat = async (appointmentId) => {
    setActionLoadingId(appointmentId)
    setError('')

    try {
      await acceptAppointmentChatApi(appointmentId)
      toast.success('Chat request accepted')
      await loadDashboard({ silent: true })
      navigate(`/doctor/chat/${appointmentId}`)
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to accept chat request'
      setError(message)
      toast.error(message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleOpenChat = (appointmentId) => {
    navigate(`/doctor/chat/${appointmentId}`)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100">
      <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-2xl font-bold text-slate-800 sm:text-3xl">Welcome, Dr. {displayName}</h1>
        <p className="mb-6 text-sm text-slate-500">Manage your profile, appointments, and weekly availability.</p>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
          </div>
        ) : (
          <div className="grid gap-6 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="w-full max-w-full overflow-hidden">
              <ProfileSidebar profile={profile} onEdit={() => setIsEditOpen(true)} onImageChange={handleImageChange} />
            </div>

            <section className="min-w-0 space-y-6 overflow-hidden">
              <AppointmentsCard
                title="New Appointments"
                appointments={newAppointments}
                accentClass="bg-blue-600"
                emptyMessage="No new appointments"
                type="new"
                onAction={handleAppointmentAction}
              />

              <AppointmentsCard
                title="Completed Appointments"
                appointments={completedAppointments}
                accentClass="bg-emerald-600"
                emptyMessage="No completed appointments"
                type="completed"
                onAction={handleAppointmentAction}
              />

              <ChatRequestsCard
                requests={chatRequests}
                onAccept={handleAcceptChat}
                onOpenChat={handleOpenChat}
                actionLoadingId={actionLoadingId}
              />

              <div className="w-full max-w-full overflow-hidden rounded-xl bg-purple-50/40 p-1">
                <Timetable
                  value={timetableView}
                  editing={editingTimetable}
                  onToggle={handleTimetableToggle}
                  onEditToggle={handleTimetableEditToggle}
                  onSave={handleSaveTimetable}
                />
              </div>
            </section>
          </div>
        )}
      </main>

      <EditProfileModal
        isOpen={isEditOpen}
        profile={profile}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveProfile}
      />
    </div>
  )
}

export default DoctorDashboard
