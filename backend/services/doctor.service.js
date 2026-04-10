const prisma = require('../config/prisma')

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

function normalizeGender(value) {
  const next = String(value || '').trim().toLowerCase()
  if (next === 'male') return 'Male'
  if (next === 'female') return 'Female'
  if (next === 'other') return 'Other'
  return null
}

function buildDefaultTimetableRows(doctorId) {
  const rows = []

  for (const day of WEEK_DAYS) {
    for (const timeSlot of TIME_SLOTS) {
      rows.push({
        doctorId,
        day,
        timeSlot,
        isAvailable: false,
      })
    }
  }

  return rows
}

async function ensureDoctorProfile(userId) {
  const existing = await prisma.doctorProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  })

  if (existing) {
    return existing
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  if (!user) {
    const error = new Error('Doctor not found for this user')
    error.statusCode = 404
    throw error
  }

  await prisma.doctorProfile.create({
    data: {
      userId,
      fullName: user.name,
      age: null,
      gender: null,
      specialization: '',
      education: null,
      phone: null,
      experience: 0,
      hospitalName: null,
      availableTimings: null,
      consultationFee: null,
      profileImage: null,
      weeklyAvailability: null,
      isVerified: false,
      verified: false,
    },
  })

  return prisma.doctorProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  })
}

async function getDoctorProfileOrThrow(userId) {
  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      fullName: true,
      age: true,
      gender: true,
      specialization: true,
      education: true,
      phone: true,
      experience: true,
      hospitalName: true,
      availableTimings: true,
      consultationFee: true,
      profileImage: true,
      weeklyAvailability: true,
      isVerified: true,
      verified: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  })

  if (!doctorProfile) {
    const error = new Error('Doctor not found')
    error.statusCode = 404
    throw error
  }

  return doctorProfile
}

async function ensureDoctorTimetableRows(doctorId) {
  const existingRows = await prisma.timetable.findMany({
    where: { doctorId },
    select: {
      day: true,
      timeSlot: true,
      isAvailable: true,
    },
  })

  const key = (day, time) => `${day}-${time}`
  const existingMap = new Map(existingRows.map((row) => [key(row.day, row.timeSlot), row]))
  const allRows = buildDefaultTimetableRows(doctorId)

  const missingRows = allRows.filter((row) => !existingMap.has(key(row.day, row.timeSlot)))

  if (missingRows.length > 0) {
    await prisma.timetable.createMany({
      data: missingRows,
      skipDuplicates: true,
    })
  }

  return allRows
    .map((row) => {
      const existing = existingMap.get(key(row.day, row.timeSlot))
      return {
        day: row.day,
        timeSlot: row.timeSlot,
        isAvailable: existing ? Boolean(existing.isAvailable) : false,
      }
    })
}

async function createDoctorProfile(userId, payload) {
  const existingProfile = await prisma.doctorProfile.findUnique({ where: { userId } })
  if (existingProfile) {
    const error = new Error('Doctor profile already exists')
    error.statusCode = 409
    throw error
  }

  const profile = await prisma.doctorProfile.create({
    data: {
      userId,
      fullName: payload.fullName,
      age: payload.age,
      gender: normalizeGender(payload.gender),
      specialization: payload.specialization,
      education: payload.education || null,
      phone: payload.phone || null,
      experience: payload.experience,
      hospitalName: payload.hospitalName || null,
      availableTimings: payload.availableTimings || null,
      consultationFee: payload.consultationFee === '' || payload.consultationFee == null ? null : payload.consultationFee,
      profileImage: payload.profileImage || null,
      weeklyAvailability: payload.weeklyAvailability || null,
      isVerified: false,
      verified: false,
    },
  })

  return profile
}

async function completeDoctorProfile(userId, payload, fallbackName) {
  const safePayload = payload || {}
  const existing = await prisma.doctorProfile.findUnique({
    where: { userId },
    select: { id: true, fullName: true },
  })

  const fullName = safePayload.fullName || existing?.fullName || fallbackName || 'Doctor'

  if (existing) {
    return prisma.doctorProfile.update({
      where: { userId },
      data: {
        fullName,
        age: safePayload.age ?? null,
        gender: normalizeGender(safePayload.gender),
        specialization: safePayload.specialization,
        education: safePayload.education || null,
        phone: safePayload.phone || null,
        experience: safePayload.experience,
        hospitalName: safePayload.hospitalName || null,
        availableTimings: safePayload.availableTimings || null,
        consultationFee: safePayload.consultationFee === '' || safePayload.consultationFee == null ? null : safePayload.consultationFee,
        profileImage: safePayload.profileImage || null,
      },
    })
  }

  const profile = await prisma.doctorProfile.create({
    data: {
      userId,
      fullName,
      age: safePayload.age ?? null,
      gender: normalizeGender(safePayload.gender),
      specialization: safePayload.specialization,
      education: safePayload.education || null,
      phone: safePayload.phone || null,
      experience: safePayload.experience,
      hospitalName: safePayload.hospitalName || null,
      availableTimings: safePayload.availableTimings || null,
      consultationFee: safePayload.consultationFee === '' || safePayload.consultationFee == null ? null : safePayload.consultationFee,
      profileImage: safePayload.profileImage || null,
      weeklyAvailability: null,
      isVerified: true,
      verified: true,
    },
  })

  await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true },
  })

  return profile
}

async function listDoctors({ specialization, experience, search, page, limit }) {
  const where = {
    ...(specialization
      ? {
          specialization: {
            contains: specialization,
            mode: 'insensitive',
          },
        }
      : {}),
    ...(typeof experience === 'number'
      ? {
          experience: {
            gte: experience,
          },
        }
      : {}),
    ...(search
      ? {
          fullName: {
            contains: search,
            mode: 'insensitive',
          },
        }
      : {}),
  }

  const skip = (page - 1) * limit

  const [total, doctors] = await Promise.all([
    prisma.doctorProfile.count({ where }),
    prisma.doctorProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        fullName: true,
        age: true,
        specialization: true,
        experience: true,
        education: true,
        phone: true,
        hospitalName: true,
        consultationFee: true,
        profileImage: true,
        weeklyAvailability: true,
        isVerified: true,
      },
    }),
  ])

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    data: doctors.map((doctor) => ({
      id: doctor.id,
      fullName: doctor.fullName,
      specialization: doctor.specialization,
      experience: doctor.experience,
      hospital: doctor.hospitalName,
      consultationFee: doctor.consultationFee,
    })),
  }
}

async function getDoctorById(id) {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      appointments: {
        select: {
          id: true,
          date: true,
          time: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      timetables: {
        select: {
          id: true,
          day: true,
          timeSlot: true,
          isAvailable: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  })

  if (!doctor) {
    const error = new Error('Doctor not found')
    error.statusCode = 404
    throw error
  }

  return {
    ...doctor,
    doctorProfile: {
      id: doctor.id,
      doctorId: doctor.id,
      specialization: doctor.specialization,
      age: doctor.age,
      phone: doctor.phone,
      education: doctor.education,
      experience: doctor.experience,
    },
    timetable: doctor.timetables || [],
    appointments: doctor.appointments || [],
  }
}

async function getDoctorAvailabilityById(id) {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id },
    select: {
      id: true,
    },
  })

  if (!doctor) {
    const error = new Error('Doctor not found')
    error.statusCode = 404
    throw error
  }

  const availability = await prisma.timetable.findMany({
    where: { doctorId: id },
    orderBy: [{ day: 'asc' }, { timeSlot: 'asc' }],
    select: {
      day: true,
      timeSlot: true,
      isAvailable: true,
    },
  })

  return availability
}

async function getDoctorProfile(userId) {
  const doctorWithRelations = await prisma.doctorProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      appointments: {
        select: {
          id: true,
          date: true,
          time: true,
          status: true,
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
      },
      timetables: {
        select: {
          id: true,
          day: true,
          timeSlot: true,
          isAvailable: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  })

  if (!doctorWithRelations) {
    const error = new Error('Doctor profile not found')
    error.statusCode = 404
    throw error
  }

  const doctorProfile = {
    id: doctorWithRelations.id,
    fullName: doctorWithRelations.fullName,
    age: doctorWithRelations.age,
    gender: doctorWithRelations.gender,
    specialization: doctorWithRelations.specialization,
    education: doctorWithRelations.education,
    phone: doctorWithRelations.phone,
    experience: doctorWithRelations.experience,
    hospitalName: doctorWithRelations.hospitalName,
    availableTimings: doctorWithRelations.availableTimings,
    consultationFee: doctorWithRelations.consultationFee,
    profileImage: doctorWithRelations.profileImage,
    weeklyAvailability: doctorWithRelations.weeklyAvailability,
    isVerified: doctorWithRelations.isVerified,
    verified: doctorWithRelations.verified,
    user: doctorWithRelations.user,
  }

  return {
    id: doctorWithRelations.id,
    userId: doctorWithRelations.userId,
    name: doctorWithRelations.user?.name || doctorWithRelations.fullName,
    email: doctorWithRelations.user?.email || '',
    specialization: doctorWithRelations.specialization || '',
    age: doctorWithRelations.age ?? 0,
    gender: doctorWithRelations.gender || '',
    phone: doctorWithRelations.phone || '',
    fullName: doctorWithRelations.fullName,
    ...doctorWithRelations,
    doctorProfile,
    timetable: doctorWithRelations.timetables || [],
    appointments: doctorWithRelations.appointments || [],
  }
}

async function getDoctorDashboard(userId) {
  const doctorProfile = await getDoctorProfileOrThrow(userId)

  const [timetable, appointments] = await Promise.all([
    prisma.timetable.findMany({
      where: { doctorId: doctorProfile.id },
      orderBy: [{ day: 'asc' }, { timeSlot: 'asc' }],
      select: {
        day: true,
        timeSlot: true,
        isAvailable: true,
      },
    }),
    prisma.appointment.findMany({
      where: { doctorId: doctorProfile.id },
      orderBy: [{ date: 'asc' }],
      select: {
        id: true,
        date: true,
        time: true,
        status: true,
        appointmentType: true,
        chatStatus: true,
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
    }),
  ])

  return {
    profile: {
      id: doctorProfile.id,
      fullName: doctorProfile.fullName,
      user: doctorProfile.user,
      age: doctorProfile.age,
      gender: doctorProfile.gender,
      specialization: doctorProfile.specialization,
      education: doctorProfile.education,
      experience: doctorProfile.experience,
      phone: doctorProfile.phone,
      hospitalName: doctorProfile.hospitalName,
      availableTimings: doctorProfile.availableTimings,
      consultationFee: doctorProfile.consultationFee,
      profileImage: doctorProfile.profileImage,
      weeklyAvailability: doctorProfile.weeklyAvailability,
      verified: doctorProfile.verified,
      isVerified: doctorProfile.isVerified,
    },
    timetable,
    appointments: appointments.map((appointment) => ({
      id: appointment.id,
      patientName: appointment.patient?.name || 'Patient',
      appointmentType: appointment.appointmentType,
      chatStatus: appointment.chatStatus,
      patient: {
        id: appointment.patient?.id,
        name: appointment.patient?.name || 'Patient',
        email: appointment.patient?.email || '',
        patientProfile: {
          symptoms: appointment.patient?.patientProfile?.symptoms || '',
        },
      },
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
    })),
  }
}

async function getDoctorTimetable(userId) {
  const doctorProfile = await getDoctorProfileOrThrow(userId)
  const timetableRows = await ensureDoctorTimetableRows(doctorProfile.id)

  return timetableRows
}

async function updateDoctorTimetable(userId, timetable) {
  const doctorProfile = await getDoctorProfileOrThrow(userId)

  const timetableRows = []

  if (Array.isArray(timetable)) {
    for (const slot of timetable) {
      if (!slot?.day || !slot?.timeSlot) {
        continue
      }

      timetableRows.push({
        doctorId: doctorProfile.id,
        day: slot.day,
        timeSlot: slot.timeSlot,
        isAvailable: Boolean(slot.isAvailable),
      })
    }
  } else {
    for (const [day, slots] of Object.entries(timetable || {})) {
      if (!Array.isArray(slots)) {
        continue
      }

      for (const slot of slots) {
        const time = slot?.time || slot?.timeSlot
        if (!time) {
          continue
        }

        timetableRows.push({
          doctorId: doctorProfile.id,
          day,
          timeSlot: time,
          isAvailable: Boolean(slot.available ?? slot.isAvailable),
        })
      }
    }
  }

  if (timetableRows.length > 0) {
    await prisma.timetable.createMany({
      data: timetableRows,
      skipDuplicates: true,
    })

    for (const slot of timetableRows) {
      await prisma.timetable.updateMany({
        where: {
          doctorId: doctorProfile.id,
          day: slot.day,
          timeSlot: slot.timeSlot,
        },
        data: {
          isAvailable: Boolean(slot.isAvailable),
        },
      })
    }
  } else {
    await prisma.timetable.createMany({
      data: buildDefaultTimetableRows(doctorProfile.id),
      skipDuplicates: true,
    })
  }

  const ensuredRows = await prisma.timetable.findMany({
    where: { doctorId: doctorProfile.id },
    orderBy: [{ day: 'asc' }, { timeSlot: 'asc' }],
    select: {
      day: true,
      timeSlot: true,
      isAvailable: true,
    },
  })
  return ensuredRows
}

async function updateDoctorProfile(userId, payload) {
  const existing = await getDoctorProfileOrThrow(userId)

  if (payload.name) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: payload.name },
    })
  }

  const profile = await prisma.doctorProfile.update({
    where: { userId },
    data: {
      fullName: payload.name || existing.fullName,
      age: payload.age == null ? existing.age : payload.age,
      gender: payload.gender == null ? existing.gender : normalizeGender(payload.gender),
      specialization:
        payload.specialization == null || payload.specialization === ''
          ? existing.specialization
          : payload.specialization,
      education: payload.education == null ? existing.education : payload.education || null,
      phone: payload.phone == null ? existing.phone : payload.phone || null,
      hospitalName: payload.hospitalName == null ? existing.hospitalName : payload.hospitalName || null,
      availableTimings:
        payload.availableTimings == null ? existing.availableTimings : payload.availableTimings || null,
      consultationFee: payload.consultationFee === '' || payload.consultationFee == null ? null : payload.consultationFee,
      profileImage: payload.profileImage == null ? existing.profileImage : payload.profileImage || null,
      weeklyAvailability: payload.weeklyAvailability == null ? existing.weeklyAvailability : payload.weeklyAvailability,
    },
    select: {
      id: true,
      fullName: true,
      age: true,
      gender: true,
      specialization: true,
      education: true,
      phone: true,
      experience: true,
      hospitalName: true,
      availableTimings: true,
      consultationFee: true,
      verified: true,
      profileImage: true,
      weeklyAvailability: true,
      isVerified: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  })

  return profile
}

module.exports = {
  createDoctorProfile,
  completeDoctorProfile,
  listDoctors,
  getDoctorById,
  getDoctorAvailabilityById,
  getDoctorProfile,
  getDoctorDashboard,
  getDoctorTimetable,
  updateDoctorTimetable,
  updateDoctorProfile,
}
