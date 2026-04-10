const prisma = require('../config/prisma')

function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

async function getAppointmentParticipants(appointmentId) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      patientId: true,
      appointmentType: true,
      chatStatus: true,
      status: true,
      doctor: {
        select: {
          id: true,
          userId: true,
          fullName: true,
          specialization: true,
        },
      },
    },
  })

  if (!appointment) {
    throw createError('Appointment not found', 404)
  }

  return appointment
}

async function ensureAppointmentParticipant(appointmentId, userId) {
  const appointment = await getAppointmentParticipants(appointmentId)
  const doctorUserId = appointment.doctor.userId

  const isParticipant = appointment.patientId === userId || doctorUserId === userId
  if (!isParticipant) {
    throw createError('Forbidden', 403)
  }

  return appointment
}

function resolveReceiverId(appointment, senderId) {
  return appointment.patientId === senderId ? appointment.doctor.userId : appointment.patientId
}

async function createMessage({ senderId, appointmentId, message }) {
  const appointment = await ensureAppointmentParticipant(appointmentId, senderId)

  // Doctors can reply only after accepting chat for online appointments.
  if (
    appointment.appointmentType === 'online' &&
    senderId === appointment.doctor.userId &&
    appointment.chatStatus !== 'accepted'
  ) {
    throw createError('Accept chat request before replying', 403)
  }

  const receiverId = resolveReceiverId(appointment, senderId)

  const created = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      appointmentId,
      message,
    },
    select: {
      id: true,
      senderId: true,
      receiverId: true,
      appointmentId: true,
      message: true,
      createdAt: true,
      sender: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  })

  return created
}

async function getMessagesByAppointment(appointmentId, userId) {
  await ensureAppointmentParticipant(appointmentId, userId)

  return prisma.message.findMany({
    where: { appointmentId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      senderId: true,
      receiverId: true,
      appointmentId: true,
      message: true,
      createdAt: true,
      sender: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  })
}

async function getChatContextByAppointment(appointmentId, userId) {
  const appointment = await ensureAppointmentParticipant(appointmentId, userId)

  return {
    appointmentId: appointment.id,
    appointmentType: appointment.appointmentType,
    appointmentStatus: appointment.status,
    chatStatus: appointment.chatStatus,
    doctor: {
      id: appointment.doctor.id,
      userId: appointment.doctor.userId,
      fullName: appointment.doctor.fullName,
      specialization: appointment.doctor.specialization,
    },
    patient: {
      id: appointment.patientId,
    },
    canDoctorReply: appointment.chatStatus === 'accepted',
  }
}

module.exports = {
  ensureAppointmentParticipant,
  createMessage,
  getMessagesByAppointment,
  getChatContextByAppointment,
}
