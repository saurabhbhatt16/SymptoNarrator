const prisma = require('../config/prisma')

function createMonthSeries(monthCount = 6) {
  const months = []
  const now = new Date()

  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleString('en-US', { month: 'short' })
    months.push({ key, month: label })
  }

  return months
}

function getMonthKey(dateValue) {
  const date = new Date(dateValue)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function aggregateMonthlyCounts(rows, months) {
  const counts = Object.fromEntries(months.map((item) => [item.key, 0]))

  rows.forEach((row) => {
    const monthKey = getMonthKey(row.createdAt)
    if (monthKey in counts) {
      counts[monthKey] += 1
    }
  })

  return months.map((item) => ({ month: item.month, count: counts[item.key] }))
}

function aggregateMonthlyAppointmentOutcome(rows, months) {
  const counts = Object.fromEntries(months.map((item) => [item.key, { accepted: 0, rejected: 0 }]))

  rows.forEach((row) => {
    const monthKey = getMonthKey(row.createdAt)
    if (!(monthKey in counts)) {
      return
    }

    if (row.status === 'accepted') {
      counts[monthKey].accepted += 1
    }

    if (row.status === 'rejected') {
      counts[monthKey].rejected += 1
    }
  })

  return months.map((item) => ({
    month: item.month,
    accepted: counts[item.key].accepted,
    rejected: counts[item.key].rejected,
  }))
}

async function getAdminStats() {
  const months = createMonthSeries(6)
  const firstMonthDate = new Date()
  firstMonthDate.setDate(1)
  firstMonthDate.setHours(0, 0, 0, 0)
  firstMonthDate.setMonth(firstMonthDate.getMonth() - (months.length - 1))

  const [
    totalPatients,
    totalDoctors,
    totalAppointments,
    totalPendingDoctors,
    patientsByMonth,
    doctorsByMonth,
    appointmentsByMonth,
  ] =
    await Promise.all([
      prisma.user.count({ where: { role: 'patient' } }),
      prisma.user.count({ where: { role: 'doctor' } }),
      prisma.appointment.count(),
      prisma.user.count({ where: { role: 'doctor', isVerified: false } }),
      prisma.user.findMany({
        where: {
          role: 'patient',
          createdAt: { gte: firstMonthDate },
        },
        select: { createdAt: true },
      }),
      prisma.user.findMany({
        where: {
          role: 'doctor',
          createdAt: { gte: firstMonthDate },
        },
        select: { createdAt: true },
      }),
      prisma.appointment.findMany({
        where: { createdAt: { gte: firstMonthDate } },
        select: {
          createdAt: true,
          status: true,
        },
      }),
    ])

  return {
    totalPatients,
    totalDoctors,
    totalAppointments,
    totalPendingDoctors,
    monthlyPatientRegistrations: aggregateMonthlyCounts(patientsByMonth, months),
    monthlyDoctorRegistrations: aggregateMonthlyCounts(doctorsByMonth, months),
    monthlyAppointmentsCreated: aggregateMonthlyCounts(appointmentsByMonth, months),
    appointmentOutcome: aggregateMonthlyAppointmentOutcome(appointmentsByMonth, months),
  }
}

async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

async function deleteUser(id) {
  return prisma.user.delete({ where: { id } })
}

async function getAllDoctors() {
  return prisma.user.findMany({
    where: { role: 'doctor', isVerified: true },
    select: {
      id: true,
      name: true,
      email: true,
      isVerified: true,
      createdAt: true,
      doctorProfile: {
        select: {
          id: true,
          fullName: true,
          specialization: true,
          experience: true,
          hospitalName: true,
          consultationFee: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  }).then((rows) => {
    const allDoctors = rows.map((row) => ({
      id: row.id,
      fullName: row.doctorProfile?.fullName || row.name,
      specialization: row.doctorProfile?.specialization || 'Not completed',
      experience: row.doctorProfile?.experience ?? null,
      hospitalName: row.doctorProfile?.hospitalName ?? null,
      consultationFee: row.doctorProfile?.consultationFee ?? null,
      isVerified: row.isVerified,
      createdAt: row.createdAt,
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
      },
    }))

    return allDoctors
  })
}

async function getPendingDoctors() {
  return prisma.user.findMany({
    where: { role: 'doctor', isVerified: false },
    select: {
      id: true,
      name: true,
      email: true,
      isVerified: true,
      doctorProfile: {
        select: {
          specialization: true,
          education: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  }).then((rows) => {
    const pendingDoctors = rows.map((row) => ({
      id: row.id,
      fullName: row.name,
      specialization: row.doctorProfile?.specialization || 'Not completed',
      education: row.doctorProfile?.education || null,
      phone: row.doctorProfile?.phone || null,
      isVerified: row.isVerified,
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
      },
    }))

    return pendingDoctors
  })
}

async function getAllAppointments() {
  return prisma.appointment.findMany({
    select: {
      id: true,
      date: true,
      status: true,
      createdAt: true,
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      doctor: {
        select: {
          id: true,
          fullName: true,
          specialization: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

async function verifyDoctor(id) {
  const doctorUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  })

  if (!doctorUser || doctorUser.role !== 'doctor') {
    const error = new Error('Doctor not found')
    error.statusCode = 404
    throw error
  }

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { isVerified: true },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
      },
    }),
    prisma.doctorProfile.updateMany({
      where: { userId: id },
      data: {
        isVerified: true,
        verified: true,
      },
    }),
  ])

  return updatedUser
}

async function rejectDoctor(id) {
  const doctor = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } })

  if (!doctor || doctor.role !== 'doctor') {
    const error = new Error('Doctor not found')
    error.statusCode = 404
    throw error
  }

  await prisma.user.delete({ where: { id: doctor.id } })
  return { message: 'Doctor rejected successfully' }
}

module.exports = {
  getAdminStats,
  getAllUsers,
  deleteUser,
  getAllDoctors,
  getPendingDoctors,
  getAllAppointments,
  verifyDoctor,
  rejectDoctor,
}
