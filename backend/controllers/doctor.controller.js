const Joi = require('joi')
const {
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
} = require('../services/doctor.service')
const prisma = require('../config/prisma')

const genderSchema = Joi.string().trim().insensitive().valid('Male', 'Female', 'Other').allow('', null)

const doctorSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(120).required(),
  age: Joi.number().integer().min(0).max(120).allow(null),
  gender: genderSchema,
  specialization: Joi.string().trim().min(2).max(120).required(),
  education: Joi.string().trim().max(200).allow('', null),
  phone: Joi.string().trim().min(5).max(30).required(),
  experience: Joi.number().integer().min(0).max(80).required(),
  hospitalName: Joi.string().trim().max(160).allow('', null),
  availableTimings: Joi.string().trim().max(120).allow('', null),
  consultationFee: Joi.number().min(0).allow('', null),
  profileImage: Joi.string().allow('', null),
  weeklyAvailability: Joi.any().optional(),
})

const updateDoctorSchema = Joi.object({
  name: Joi.string().trim().max(120).allow('', null),
  age: Joi.number().integer().min(0).max(120).allow(null),
  gender: genderSchema,
  specialization: Joi.string().trim().max(120).allow('', null),
  education: Joi.string().trim().max(200).allow('', null),
  phone: Joi.string().trim().max(30).allow('', null),
  hospitalName: Joi.string().trim().max(160).allow('', null),
  availableTimings: Joi.string().trim().max(120).allow('', null),
  consultationFee: Joi.number().min(0).allow('', null),
  profileImage: Joi.string().allow('', null),
  weeklyAvailability: Joi.any().optional(),
})

const completeDoctorProfileSchema = Joi.object({
  specialization: Joi.string().trim().min(2).max(120).required(),
  age: Joi.number().integer().min(0).max(120).allow(null),
  gender: Joi.string().trim().insensitive().valid('Male', 'Female', 'Other').required(),
  phone: Joi.string().trim().min(5).max(30).required(),
  hospitalName: Joi.string().trim().max(160).allow('', null),
  experience: Joi.number().integer().min(0).max(80).required(),
  consultationFee: Joi.number().min(0).allow('', null),
  education: Joi.string().trim().max(200).allow('', null),
  availableTimings: Joi.string().trim().max(120).allow('', null),
  profileImage: Joi.string().allow('', null),
})

const listDoctorsSchema = Joi.object({
  specialization: Joi.string().trim().allow(''),
  experience: Joi.number().integer().min(0),
  search: Joi.string().trim().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(6),
})

async function createProfile(req, res, next) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can create this profile' })
    }

    if (!req.user.isVerified) {
      return res.status(403).json({ message: 'Doctor verification is pending' })
    }

    const { error, value } = doctorSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const profile = await createDoctorProfile(req.user.id, value)
    return res.status(201).json({
      message: 'Doctor profile created',
      profile,
    })
  } catch (err) {
    return next(err)
  }
}

async function completeProfile(req, res, next) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can complete profile' })
    }

    if (!req.user.isVerified) {
      return res.status(403).json({ message: 'Doctor verification is pending' })
    }

    const { error, value } = completeDoctorProfileSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const profile = await completeDoctorProfile(req.user.id, value, req.user.name)
    return res.status(200).json({ message: 'Doctor profile completed', profile })
  } catch (err) {
    return next(err)
  }
}

async function getMyProfile(req, res, next) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can access this profile' })
    }

    const userId = req.user?.id
    if (!userId) {
      return res.status(400).json({ message: 'Doctor ID missing' })
    }

    // Fetch doctor profile with all relations using userId mapping
    const doctorProfile = await prisma.doctorProfile.findUnique({
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

    if (!doctorProfile) {
      return res.status(404).json({ message: 'Doctor not found' })
    }

    return res.status(200).json({
      profile: {
        id: doctorProfile.id,
        fullName: doctorProfile.user?.name || doctorProfile.fullName,
        user: doctorProfile.user,
        specialization: doctorProfile.specialization || '',
        age: doctorProfile.age || null,
        gender: doctorProfile.gender || '',
        education: doctorProfile.education || '',
        phone: doctorProfile.phone || '',
        experience: doctorProfile.experience || 0,
        hospitalName: doctorProfile.hospitalName || '',
        availableTimings: doctorProfile.availableTimings || '',
        consultationFee: doctorProfile.consultationFee ?? null,
        profileImage: doctorProfile.profileImage || '',
        weeklyAvailability: doctorProfile.weeklyAvailability || null,
        verified: doctorProfile.verified,
        isVerified: doctorProfile.isVerified,
      },
      doctor: {
        id: doctorProfile.id,
        fullName: doctorProfile.user?.name || doctorProfile.fullName,
        user: doctorProfile.user,
        specialization: doctorProfile.specialization || '',
        age: doctorProfile.age || null,
        gender: doctorProfile.gender || '',
        education: doctorProfile.education || '',
        phone: doctorProfile.phone || '',
        experience: doctorProfile.experience || 0,
        hospitalName: doctorProfile.hospitalName || '',
        availableTimings: doctorProfile.availableTimings || '',
        consultationFee: doctorProfile.consultationFee ?? null,
        profileImage: doctorProfile.profileImage || '',
        weeklyAvailability: doctorProfile.weeklyAvailability || null,
        verified: doctorProfile.verified,
        isVerified: doctorProfile.isVerified,
      },
      timetable: doctorProfile.timetables || [],
      appointments: doctorProfile.appointments || [],
    })
  } catch (err) {
    return next(err)
  }
}

async function getDashboard(req, res, next) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can access this dashboard' })
    }

    const dashboard = await getDoctorDashboard(req.user.id)
    return res.status(200).json(dashboard)
  } catch (err) {
    return next(err)
  }
}

async function getMyTimetable(req, res, next) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can access this timetable' })
    }
    const timetable = await getDoctorTimetable(req.user.id)
    return res.status(200).json({ timetable })
  } catch (err) {
    return next(err)
  }
}

async function updateMyTimetable(req, res, next) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can update this timetable' })
    }

    const timetable = await updateDoctorTimetable(req.user.id, req.body)
    return res.status(200).json({ message: 'Doctor timetable updated', timetable })
  } catch (err) {
    return next(err)
  }
}

async function updateMyProfile(req, res, next) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can update this profile' })
    }

    const userId = req.user?.id
    if (!userId) {
      return res.status(400).json({ message: 'Doctor ID missing' })
    }

    const { error, value } = updateDoctorSchema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
      convert: true,
    })
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const profile = await updateDoctorProfile(userId, value)
    
    // Fetch updated doctor profile to return complete data
    const doctorProfile = await prisma.doctorProfile.findUnique({
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

    return res.status(200).json({ 
      message: 'Doctor profile updated', 
      profile: {
        ...profile,
        user: doctorProfile?.user,
      }
    })
  } catch (err) {
    return next(err)
  }
}

async function getDoctors(req, res, next) {
  try {
    const { error, value } = listDoctorsSchema.validate(req.query, { convert: true })
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const result = await listDoctors({
      specialization: value.specialization || undefined,
      experience: typeof value.experience === 'number' ? value.experience : undefined,
      search: value.search || undefined,
      page: value.page,
      limit: value.limit,
    })

    return res.status(200).json(result)
  } catch (err) {
    return next(err)
  }
}

async function getDoctor(req, res, next) {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(404).json({ message: 'Doctor not found' })
    }

    const doctor = await getDoctorById(id)
    return res.status(200).json({ doctor })
  } catch (err) {
    return next(err)
  }
}

async function getDoctorAvailability(req, res, next) {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(404).json({ message: 'Doctor not found' })
    }

    const availability = await getDoctorAvailabilityById(id)
    return res.status(200).json({ availability })
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  createProfile,
  completeProfile,
  getDoctors,
  getDoctor,
  getDoctorAvailability,
  getMyProfile,
  getMyTimetable,
  updateMyTimetable,
  updateMyProfile,
  getDashboard,
}
