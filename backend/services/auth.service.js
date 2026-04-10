const bcrypt = require('bcryptjs')
const prisma = require('../config/prisma')
const { signToken } = require('../config/jwt')

const ADMIN_EMAIL = 'admin@gmail.com'

function computeNeedsOnboarding(role, profilePresence) {
  if (role === 'patient') {
    return !profilePresence.patientProfile
  }
  if (role === 'doctor') {
    return !profilePresence.doctorProfile
  }
  return false
}

function computeProfileCompleted(role, profilePresence) {
  if (role === 'doctor') {
    return Boolean(profilePresence.doctorProfile)
  }

  if (role === 'patient') {
    return Boolean(profilePresence.patientProfile)
  }

  return true
}

function computeDoctorVerification(profilePresence) {
  return Boolean(
    profilePresence.isVerified || profilePresence.doctorProfile?.isVerified || profilePresence.doctorProfile?.verified,
  )
}

async function registerUser({ name, email, password, role }) {
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    const message = role === 'doctor' ? 'Doctor already exists' : 'You already have an account. Please login.'
    const error = new Error(message)
    error.statusCode = 400
    throw error
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  // Auto-create DoctorProfile for doctors
  if (role === 'doctor') {
    await prisma.doctorProfile.create({
      data: {
        userId: user.id,
        fullName: name,
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
  }

  // Auto-create PatientProfile for patients
  if (role === 'patient') {
    await prisma.patientProfile.create({
      data: {
        userId: user.id,
        fullName: name,
        age: 0,
        gender: '',
        phone: null,
        bloodGroup: '',
        symptoms: '',
        medicalHistory: null,
      },
    })
  }

  const token = signToken({ id: user.id, userId: user.id, role: user.role, email: user.email })
  return {
    user: {
      ...user,
      needsOnboarding: role !== 'admin',
      isVerified: role === 'doctor' ? false : true,
      profileCompleted: role === 'doctor' ? false : true,
    },
    token,
  }
}

async function loginUser({ email, password, role }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      patientProfile: {
        select: { id: true },
      },
      doctorProfile: {
        select: {
          id: true,
          isVerified: true,
          verified: true,
        },
      },
    },
  })

  if (!user) {
    const error = new Error('User does not exist. Please register first.')
    error.statusCode = 404
    throw error
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    const error = new Error('Invalid credentials')
    error.statusCode = 401
    throw error
  }

  const isAdminLogin = email === ADMIN_EMAIL
  const effectiveRole = isAdminLogin ? 'admin' : role
  const authUserRole = isAdminLogin ? 'admin' : user.role

  if (!isAdminLogin && effectiveRole && effectiveRole !== user.role) {
    const error = new Error('Invalid credentials')
    error.statusCode = 401
    throw error
  }

  // Auto-create missing DoctorProfile (for backward compatibility)
  if (authUserRole === 'doctor' && !user.doctorProfile) {
    await prisma.doctorProfile.create({
      data: {
        userId: user.id,
        fullName: user.name,
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
  }

  // Auto-create missing PatientProfile (for backward compatibility)
  if (authUserRole === 'patient' && !user.patientProfile) {
    await prisma.patientProfile.create({
      data: {
        userId: user.id,
        fullName: user.name,
        age: 0,
        gender: '',
        phone: null,
        bloodGroup: '',
        symptoms: '',
        medicalHistory: null,
      },
    })
  }

  const token = signToken({ id: user.id, userId: user.id, role: authUserRole, email: user.email })

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: authUserRole,
      needsOnboarding: computeNeedsOnboarding(authUserRole, user),
      isVerified: authUserRole === 'doctor' ? computeDoctorVerification(user) : true,
      profileCompleted: computeProfileCompleted(authUserRole, user),
    },
    token,
  }
}

module.exports = {
  registerUser,
  loginUser,
}
