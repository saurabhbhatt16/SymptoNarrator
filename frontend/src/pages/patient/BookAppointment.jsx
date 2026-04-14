import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { FiArrowLeft, FiInfo } from 'react-icons/fi'
import { createAppointmentApi, searchAvailableDoctorsApi } from '../../services/appointment.service'

const TIME_SLOTS = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
]

function to24HourTime(value) {
  const match = String(value || '').trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/)
  if (!match) return null

  let hour = Number(match[1])
  const minute = match[2]
  const meridian = match[3]

  if (meridian === 'AM') {
    if (hour === 12) hour = 0
  } else if (hour !== 12) {
    hour += 12
  }

  return `${String(hour).padStart(2, '0')}:${minute}`
}

function getDayName(value) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

function getDisplayDate(value) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getTodayInputValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function BookAppointment() {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [preferredDoctors, setPreferredDoctors] = useState([])
  const [alternativeDoctors, setAlternativeDoctors] = useState([])
  const [recommendedSpecialist, setRecommendedSpecialist] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [searchingDoctors, setSearchingDoctors] = useState(false)
  const [bookingAppointment, setBookingAppointment] = useState(false)
  const [error, setError] = useState('')
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [appointmentTypeToBook, setAppointmentTypeToBook] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const selectedDay = useMemo(() => getDayName(selectedDate), [selectedDate])
  const displayDate = useMemo(() => getDisplayDate(selectedDate), [selectedDate])
  const currentDate = new Date()
  const todayInputValue = useMemo(() => getTodayInputValue(), [])
  const isSunday = selectedDay === 'Sunday'
  const isPastSelectedDate = selectedDate && selectedDate < todayInputValue

  const blockSundayBooking = () => {
    const message = 'Appointments cannot be booked on Sunday'
    setError(message)
    toast.error(message)
  }

  const handleSearchDoctors = async (event) => {
    event.preventDefault()
    setSearchingDoctors(true)
    setError('')
    setSelectedDoctor(null)
    setPreferredDoctors([])
    setAlternativeDoctors([])
    setRecommendedSpecialist('')
    setSearchPerformed(true)

    if (!selectedDate || !selectedTime) {
      setSearchingDoctors(false)
      setError('Please select both date and time')
      return
    }

    if (isPastSelectedDate) {
      setSearchingDoctors(false)
      setError('Past dates are not allowed')
      toast.error('Past dates are not allowed')
      return
    }

    if (isSunday) {
      setSearchingDoctors(false)
      blockSundayBooking()
      return
    }

    try {
      const response = await searchAvailableDoctorsApi({
        date: selectedDate,
        time: selectedTime,
      })
      const payload = response?.data ?? response ?? {}

      if (Array.isArray(payload)) {
        setPreferredDoctors(payload)
        setAlternativeDoctors([])
        setRecommendedSpecialist('')
      } else {
        setPreferredDoctors(Array.isArray(payload.preferredDoctors) ? payload.preferredDoctors : [])
        setAlternativeDoctors(Array.isArray(payload.alternativeDoctors) ? payload.alternativeDoctors : [])
        setRecommendedSpecialist(String(payload.preferredSpecialist || '').trim())
      }
    } catch (searchError) {
      setError(searchError?.response?.data?.message || 'Failed to search available doctors')
    } finally {
      setSearchingDoctors(false)
    }
  }

  const totalDoctors = preferredDoctors.length + alternativeDoctors.length

  const recommendationReason = recommendedSpecialist
    ? `Based on your latest health report, the suggested specialist is ${recommendedSpecialist}.`
    : 'Based on your latest health report.'

  const renderDoctorCard = (doctor, variant = 'preferred') => (
    <article key={doctor.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-base font-semibold text-slate-900">{doctor.fullName}</h3>
      <p className="mt-1 text-sm text-slate-600">{doctor.specialization || 'General Practitioner'}</p>
      {variant === 'preferred' ? (
        <div className="group relative mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <span>Recommended from your recent report</span>
          <span
            tabIndex={0}
            aria-label={recommendationReason}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700"
          >
            <FiInfo className="h-3 w-3" />
          </span>
          <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-64 rounded-md bg-slate-900 px-3 py-2 text-[11px] font-normal text-slate-100 opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100">
            {recommendationReason}
          </div>
        </div>
      ) : (
        <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
          Alternative available doctor
        </span>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedDoctor(doctor)
            handleBookAppointmentType('physical')
          }}
          disabled={bookingAppointment}
          className="rounded-lg bg-emerald-600 px-2 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Physical
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedDoctor(doctor)
            handleBookAppointmentType('online')
          }}
          disabled={bookingAppointment}
          className="rounded-lg bg-blue-600 px-2 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Online
        </button>
      </div>
    </article>
  )

  const handleConfirmAppointment = async (doctorArg = selectedDoctor, appointmentType = appointmentTypeToBook) => {
    if (!doctorArg) {
      setError('Please choose a doctor first')
      return
    }

    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time')
      return
    }

    if (isPastSelectedDate) {
      setError('Past dates are not allowed')
      toast.error('Past dates are not allowed')
      return
    }

    if (isSunday) {
      blockSundayBooking()
      return
    }

    if (!appointmentType) {
      setError('Please select appointment type')
      return
    }

    setBookingAppointment(true)
    setError('')

    try {
      const normalizedTime = to24HourTime(selectedTime)
      if (!normalizedTime) {
        throw new Error('Invalid time slot')
      }

      const dateTime = new Date(`${selectedDate}T${normalizedTime}:00`)
      if (Number.isNaN(dateTime.getTime())) {
        throw new Error('Invalid date or time selected')
      }

      await createAppointmentApi({
        doctorId: Number(doctorArg.id),
        date: dateTime.toISOString(),
        time: selectedTime,
        appointmentType,
      })

      toast.success('Appointment booked successfully')
      setShowConfirmModal(false)
      setAppointmentTypeToBook(null)
      setSelectedDoctor(null)
      navigate(user?.role === 'doctor' ? '/doctor/appointments' : '/appointments')
    } catch (bookError) {
      setError(bookError?.response?.data?.message || 'Failed to book appointment')
      toast.error(bookError?.response?.data?.message || 'Booking failed')
    } finally {
      setBookingAppointment(false)
    }
  }

  const handleBookDoctor = async (doctor) => {
    setSelectedDoctor(doctor)
    await handleConfirmAppointment(doctor)
  }

  const handleBookAppointmentType = (type) => {
    if (!selectedDoctor) {
      setError('Please choose a doctor first')
      return
    }
    setAppointmentTypeToBook(type)
    setShowConfirmModal(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(user?.role === 'doctor' ? '/doctor/appointments' : '/appointments')}
            aria-label="Back to my appointments"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
          >
            <FiArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-2xl font-semibold text-slate-800">Book Appointment</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">Select date and time, then choose an available doctor.</p>

        <section className="relative mt-6 rounded-xl bg-white p-6 shadow-md">
          <aside className="absolute right-4 top-4 rounded-lg bg-blue-50 p-3 text-xs text-slate-700 shadow-sm sm:right-6 sm:top-6 sm:text-sm">
            <p><strong>Day:</strong> {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</p>
            <p><strong>Date:</strong> {currentDate.toLocaleDateString('en-US')}</p>
            <p><strong>Time:</strong> {currentDate.toLocaleTimeString('en-US')}</p>
          </aside>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="pr-0 md:pr-12">
              <form onSubmit={handleSearchDoctors} className="space-y-4">
                <div>
                  <label htmlFor="appointmentDate" className="mb-1 block text-sm font-medium text-slate-700">
                    Select Date
                  </label>
                  <input
                    id="appointmentDate"
                    type="date"
                    min={todayInputValue}
                    value={selectedDate}
                    onChange={(event) => {
                      const nextDate = event.target.value
                      setSelectedDate(nextDate)

                      if (getDayName(nextDate) === 'Sunday') {
                        blockSundayBooking()
                      } else if (error === 'Appointments cannot be booked on Sunday') {
                        setError('')
                      }
                    }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                  <div className="mt-2 rounded-md bg-gray-100 p-2 text-sm text-slate-700">
                    Day: {selectedDay || '-'}
                  </div>
                  {displayDate ? (
                    <p className="mt-2 text-xs text-slate-500">Selected: {displayDate}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="timeSlot" className="mb-1 block text-sm font-medium text-slate-700">
                    Time Slot
                  </label>
                  <select
                    id="timeSlot"
                    value={selectedTime}
                    onChange={(event) => setSelectedTime(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Choose a slot</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={searchingDoctors || isSunday}
                  className="w-full rounded-lg bg-blue-600 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {searchingDoctors ? 'Searching...' : 'Search Doctors'}
                </button>
              </form>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

          {searchingDoctors ? (
            <div className="mt-5 flex items-center justify-center">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
            </div>
          ) : null}

          {totalDoctors > 0 ? (
            <div className="mt-6 space-y-6">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-800">
                  {recommendedSpecialist
                    ? `Showing ${preferredDoctors.length} ${recommendedSpecialist} doctor(s) available at your selected slot based on your recent report.`
                    : `Showing ${preferredDoctors.length} available doctor(s) for your selected slot.`}
                </p>
                {recommendedSpecialist && alternativeDoctors.length > 0 ? (
                  <p className="mt-1 text-xs text-emerald-700">
                    Plus {alternativeDoctors.length} alternative doctor(s) in case your recommended specialist is not available.
                  </p>
                ) : null}
              </div>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                  {recommendedSpecialist ? `${recommendedSpecialist} Available Doctors` : 'Available Doctors'}
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {preferredDoctors.map((doctor) => renderDoctorCard(doctor, 'preferred'))}
                </div>
                {recommendedSpecialist && preferredDoctors.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    No {recommendedSpecialist} doctors are available at this time slot.
                  </p>
                ) : null}
              </section>

              {recommendedSpecialist && alternativeDoctors.length > 0 ? (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                    Other Available Doctors
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {alternativeDoctors.map((doctor) => renderDoctorCard(doctor, 'alternative'))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}

          {searchPerformed && !searchingDoctors && totalDoctors === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              No doctors available for the selected slot.
            </p>
          ) : null}

          {/* Appointment Type Confirmation Modal */}
          {showConfirmModal && selectedDoctor && (
            <div className="fixed inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-[1px] z-50">
              <div className="w-full max-w-md rounded-xl border border-slate-100 bg-white p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-900">Confirm Appointment</h3>
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Doctor:</span> {selectedDoctor.fullName}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Date & Time:</span> {selectedDate && selectedTime ? `${selectedDate} at ${selectedTime}` : 'Not selected'}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Type:</span> 
                    <span className={`ml-2 inline-block px-2 py-1 rounded-md text-xs font-medium text-white ${
                      appointmentTypeToBook === 'physical' ? 'bg-emerald-600' : 'bg-blue-600'
                    }`}>
                      {appointmentTypeToBook === 'physical' ? 'Physical Appointment' : 'Online Appointment'}
                    </span>
                  </p>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmModal(false)
                      setAppointmentTypeToBook(null)
                    }}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmAppointment(selectedDoctor, appointmentTypeToBook)}
                    disabled={bookingAppointment}
                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {bookingAppointment ? 'Booking...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default BookAppointment