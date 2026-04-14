const prisma = require('../config/prisma')

function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function validateStatusTransition(currentStatus, nextStatus) {
  const allowedTransitions = {
    pending: ['accepted', 'rejected'],
    accepted: ['completed'],
    rejected: [],
    completed: [],
  }

  if (currentStatus === nextStatus) {
    throw createError('Appointment is already in this status', 400)
  }

  if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
    throw createError('Invalid appointment status transition', 400)
  }
}

function normalizeDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw createError('Invalid appointment date', 400)
  }

  return date
}

function getDayNameFromDate(dateValue) {
  const date = normalizeDate(dateValue)
  return date.toLocaleString('en-US', { weekday: 'long' })
}

function getNormalizedDateTime(dateValue, timeValue) {
  const normalizedTime = parseDisplayTimeTo24Hour(timeValue)
  const baseDate = normalizeDate(dateValue)
  const [hours, minutes] = normalizedTime.split(':').map(Number)
  const appointmentDate = new Date(baseDate)
  appointmentDate.setHours(hours, minutes, 0, 0)
  return { appointmentDate, normalizedTime }
}

function parseDisplayTimeTo24Hour(time) {
  const value = String(time || '').trim().toUpperCase()
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/)
  if (!match) {
    throw createError('Invalid time format', 400)
  }

  let hour = Number(match[1])
  const minute = match[2]
  const period = match[3]

  if (!Number.isInteger(hour) || hour < 1 || hour > 12) {
    throw createError('Invalid time value', 400)
  }

  if (period === 'AM') {
    if (hour === 12) hour = 0
  } else if (hour !== 12) {
    hour += 12
  }

  return `${String(hour).padStart(2, '0')}:${minute}`
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractPreferredSpecialist(reportData) {
  if (!reportData || typeof reportData !== 'object') {
    return ''
  }

  const diagnosisSpecialist = reportData?.diagnosis?.specialistDoctor
  const topLevelSpecialist = reportData?.specialist_required || reportData?.specialistDoctor
  const value = diagnosisSpecialist || topLevelSpecialist || ''
  return String(value).trim()
}

function isSpecializationMatch(doctorSpecialization, preferredSpecialist) {
  const left = normalizeText(doctorSpecialization)
  const right = normalizeText(preferredSpecialist)

  if (!left || !right) {
    return false
  }

  return left.includes(right) || right.includes(left)
}

async function getAvailableDoctors({ date, time, patientId }) {
  const { appointmentDate, normalizedTime } = getNormalizedDateTime(date, time)
  const dayName = getDayNameFromDate(date)

  const rows = await prisma.timetable.findMany({
    where: {
      day: dayName,
      timeSlot: normalizedTime,
      isAvailable: true,
    },
    select: {
      doctorId: true,
    },
  })

  const availableDoctorIds = [...new Set(rows.map((row) => row.doctorId))]
  if (availableDoctorIds.length === 0) {
    return []
  }

  const takenAppointments = await prisma.appointment.findMany({
    where: {
      date: appointmentDate,
      doctorId: { in: availableDoctorIds },
      status: { in: ['pending', 'accepted'] },
    },
    select: { doctorId: true },
  })

  const takenDoctorIds = new Set(takenAppointments.map((item) => item.doctorId))
  const searchableDoctorIds = availableDoctorIds.filter((id) => !takenDoctorIds.has(id))

  if (searchableDoctorIds.length === 0) {
    return []
  }

  const doctors = await prisma.doctorProfile.findMany({
    where: {
      id: { in: searchableDoctorIds },
      verified: true,
    },
    select: {
      id: true,
      fullName: true,
      specialization: true,
      experience: true,
      hospitalName: true,
      consultationFee: true,
      profileImage: true,
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: {
      fullName: 'asc',
    },
  })

  let preferredSpecialist = ''

  if (Number.isInteger(patientId) && patientId > 0) {
    const latestReport = await prisma.report.findFirst({
      where: { patientId },
      orderBy: [{ generatedAt: 'desc' }, { id: 'desc' }],
      select: {
        reportData: true,
      },
    })

    preferredSpecialist = extractPreferredSpecialist(latestReport?.reportData)
  }

  let preferredDoctors = []
  let alternativeDoctors = []

  if (preferredSpecialist) {
    preferredDoctors = doctors.filter((doctor) =>
      isSpecializationMatch(doctor.specialization, preferredSpecialist),
    )
    alternativeDoctors = doctors
      .filter((doctor) => !preferredDoctors.some((preferred) => preferred.id === doctor.id))
      .slice(0, 4)
  } else {
    preferredDoctors = doctors
    alternativeDoctors = []
  }

  const result = {
    preferredSpecialist,
    preferredDoctors,
    alternativeDoctors,
    totalAvailable: doctors.length,
  }

  return result
}

async function createAppointment({ patientId, doctorId, date, time, appointmentType = 'physical' }) {
  const doctorIdNumber = Number(doctorId)
  if (!Number.isInteger(doctorIdNumber) || doctorIdNumber <= 0) {
    throw createError('Invalid doctor id', 400)
  }

  const appointmentDay = getDayNameFromDate(date)
  const { appointmentDate, normalizedTime } = time
    ? getNormalizedDateTime(date, time)
    : { appointmentDate: normalizeDate(date), normalizedTime: null }

  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorIdNumber },
    select: { id: true, fullName: true, verified: true, isVerified: true, userId: true },
  })

  if (!doctor) {
    throw createError('Doctor not found', 404)
  }

  if (!doctor.verified && !doctor.isVerified) {
    throw createError('Doctor is not verified', 403)
  }

  if (!time) {
    throw createError('Invalid time', 400)
  }

  const timetableSlot = await prisma.timetable.findFirst({
    where: {
      doctorId: doctorIdNumber,
      day: appointmentDay,
      timeSlot: normalizedTime,
      isAvailable: true,
    },
    select: { id: true },
  })

  if (!timetableSlot) {
    throw createError('Selected slot is not available', 409)
  }

  const patient = await prisma.user.findUnique({
    where: { id: patientId },
    select: { id: true, role: true },
  })

  if (!patient || patient.role !== 'patient') {
    throw createError('Only patients can create appointments', 403)
  }

  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      doctorId: doctorIdNumber,
      date: appointmentDate,
      time: normalizedTime,
    },
  })

  if (existingAppointment) {
    throw createError('This slot is already booked', 409)
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId: doctorIdNumber,
      date: appointmentDate,
      time: normalizedTime,
      status: 'pending',
      appointmentType,
    },
    select: {
      id: true,
      date: true,
      time: true,
      status: true,
      appointmentType: true,
      createdAt: true,
      doctor: {
        select: {
          id: true,
          fullName: true,
          specialization: true,
          hospitalName: true,
          consultationFee: true,
          verified: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          patientProfile: {
            select: {
              age: true,
              symptoms: true,
            },
          },
        },
      },
    },
  })

  return appointment
}

async function getPatientAppointments(patientId) {
  const data = await prisma.appointment.findMany({
    where: { patientId },
    orderBy: { date: 'desc' },
    select: {
      id: true,
      date: true,
      time: true,
      status: true,
      appointmentType: true,
      chatStatus: true,
      chatRequestedAt: true,
      chatAcceptedAt: true,
      createdAt: true,
      updatedAt: true,
      doctor: {
        select: {
          id: true,
          fullName: true,
          specialization: true,
          hospitalName: true,
          consultationFee: true,
          verified: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  return data
}

async function getDoctorAppointments(doctorUserId) {
  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: doctorUserId },
    select: { id: true },
  })

  if (!doctorProfile) {
    const error = new Error('Doctor profile not found')
    error.statusCode = 404
    throw error
  }

  const data = await prisma.appointment.findMany({
    where: { doctorId: doctorProfile.id },
    orderBy: { date: 'desc' },
    select: {
      id: true,
      date: true,
      time: true,
      status: true,
      appointmentType: true,
      chatStatus: true,
      chatRequestedAt: true,
      chatAcceptedAt: true,
      createdAt: true,
      updatedAt: true,
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          patientProfile: {
            select: {
              age: true,
              symptoms: true,
            },
          },
        },
      },
    },
  })

  return data
}

async function updateAppointmentStatus(doctorUserId, appointmentId, status) {
  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: doctorUserId },
    select: { id: true },
  })

  if (!doctorProfile) {
    const error = new Error('Doctor profile not found')
    error.statusCode = 404
    throw error
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  })

  if (!appointment) {
    throw createError('Appointment not found', 404)
  }

  if (appointment.doctorId !== doctorProfile.id) {
    throw createError('Forbidden', 403)
  }

  validateStatusTransition(appointment.status, status)

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
    select: {
      id: true,
      date: true,
      time: true,
      status: true,
      appointmentType: true,
      chatStatus: true,
      chatRequestedAt: true,
      chatAcceptedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return updated
}

async function rescheduleAppointment(patientId, appointmentId, date) {
  const appointmentDate = normalizeDate(date)

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  })

  if (!appointment) {
    throw createError('Appointment not found', 404)
  }

  if (appointment.patientId !== patientId) {
    throw createError('Forbidden', 403)
  }

  if (!['pending', 'accepted'].includes(appointment.status)) {
    throw createError('Only pending or accepted appointments can be rescheduled', 400)
  }

  const slotTaken = await prisma.appointment.findFirst({
    where: {
      doctorId: appointment.doctorId,
      date: appointmentDate,
      NOT: { id: appointmentId },
    },
  })

  if (slotTaken) {
    throw createError('This new slot is already booked', 409)
  }

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      date: appointmentDate,
      status: 'pending',
    },
    select: {
      id: true,
      date: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      doctor: {
        select: {
          id: true,
          fullName: true,
          specialization: true,
          hospitalName: true,
          consultationFee: true,
          verified: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
          patientProfile: {
            select: {
              symptoms: true,
            },
          },
        },
      },
    },
  })
}

async function cancelAppointment(patientId, appointmentId) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  })

  if (!appointment) {
    throw createError('Appointment not found', 404)
  }

  if (appointment.patientId !== patientId) {
    throw createError('Forbidden', 403)
  }

  await prisma.appointment.delete({ where: { id: appointmentId } })
  return { message: 'Appointment canceled successfully' }
}

async function requestChatForAppointment(patientId, appointmentId) {
  const id = Number(appointmentId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError('Invalid appointment id', 400)
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      patientId: true,
      appointmentType: true,
      status: true,
      chatStatus: true,
    },
  })

  if (!appointment) {
    throw createError('Appointment not found', 404)
  }

  if (appointment.patientId !== patientId) {
    throw createError('Forbidden', 403)
  }

  if (appointment.appointmentType !== 'online') {
    throw createError('Chat is only available for online appointments', 400)
  }

  if (!['pending', 'accepted'].includes(appointment.status)) {
    throw createError('Chat is not available for this appointment status', 400)
  }

  if (appointment.chatStatus === 'accepted') {
    return prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        appointmentType: true,
        status: true,
        chatStatus: true,
        chatRequestedAt: true,
        chatAcceptedAt: true,
        doctor: {
          select: {
            id: true,
            fullName: true,
            userId: true,
          },
        },
      },
    })
  }

  return prisma.appointment.update({
    where: { id },
    data: {
      chatStatus: 'requested',
      chatRequestedAt: new Date(),
    },
    select: {
      id: true,
      appointmentType: true,
      status: true,
      chatStatus: true,
      chatRequestedAt: true,
      chatAcceptedAt: true,
      doctor: {
        select: {
          id: true,
          fullName: true,
          userId: true,
        },
      },
    },
  })
}

async function acceptChatRequest(doctorUserId, appointmentId) {
  const id = Number(appointmentId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError('Invalid appointment id', 400)
  }

  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: doctorUserId },
    select: { id: true },
  })

  if (!doctorProfile) {
    throw createError('Doctor profile not found', 404)
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      doctorId: true,
      appointmentType: true,
      status: true,
      chatStatus: true,
    },
  })

  if (!appointment) {
    throw createError('Appointment not found', 404)
  }

  if (appointment.doctorId !== doctorProfile.id) {
    throw createError('Forbidden', 403)
  }

  if (appointment.appointmentType !== 'online') {
    throw createError('Chat is only available for online appointments', 400)
  }

  if (!['pending', 'accepted'].includes(appointment.status)) {
    throw createError('Chat is not available for this appointment status', 400)
  }

  return prisma.appointment.update({
    where: { id },
    data: {
      chatStatus: 'accepted',
      chatAcceptedAt: new Date(),
      chatRequestedAt: appointment.chatStatus === 'none' ? new Date() : undefined,
    },
    select: {
      id: true,
      appointmentType: true,
      status: true,
      chatStatus: true,
      chatRequestedAt: true,
      chatAcceptedAt: true,
      patient: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}

async function getDoctorChatRequests(doctorUserId) {
  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: doctorUserId },
    select: { id: true },
  })

  if (!doctorProfile) {
    throw createError('Doctor profile not found', 404)
  }

  return prisma.appointment.findMany({
    where: {
      doctorId: doctorProfile.id,
      appointmentType: 'online',
      chatStatus: 'requested',
      status: { in: ['pending', 'accepted'] },
    },
    orderBy: { chatRequestedAt: 'desc' },
    select: {
      id: true,
      date: true,
      time: true,
      status: true,
      appointmentType: true,
      chatStatus: true,
      chatRequestedAt: true,
      patient: {
        select: {
          id: true,
          name: true,
          patientProfile: {
            select: {
              age: true,
              symptoms: true,
            },
          },
        },
      },
    },
  })
}

module.exports = {
  createAppointment,
  getAvailableDoctors,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
  requestChatForAppointment,
  acceptChatRequest,
  getDoctorChatRequests,
}
