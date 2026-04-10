const prisma = require('../config/prisma')

async function createPatientProfile(userId, payload) {
  const existingProfile = await prisma.patientProfile.findUnique({ where: { userId } })
  if (existingProfile) {
    const error = new Error('Patient profile already exists')
    error.statusCode = 409
    throw error
  }

  const profile = await prisma.patientProfile.create({
    data: {
      userId,
      fullName: payload.fullName,
      age: payload.age,
      gender: payload.gender,
      phone: payload.phone || null,
      bloodGroup: payload.bloodGroup,
      symptoms: payload.symptoms,
      medicalHistory: payload.medicalHistory || null,
    },
  })

  return profile
}

async function getPatientProfile(userId) {
  const profile = await prisma.patientProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      fullName: true,
      age: true,
      gender: true,
      phone: true,
      bloodGroup: true,
      symptoms: true,
      medicalHistory: true,
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

  if (!profile) {
    const error = new Error('Patient profile not found')
    error.statusCode = 404
    throw error
  }

  return profile
}

async function updatePatientProfile(userId, payload) {
  const existing = await prisma.patientProfile.findUnique({ where: { userId } })

  if (!existing) {
    const error = new Error('Patient profile not found')
    error.statusCode = 404
    throw error
  }

  if (payload.name) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: payload.name },
    })
  }

  const profile = await prisma.patientProfile.update({
    where: { userId },
    data: {
      fullName: payload.name,
      age: payload.age,
      gender: payload.gender,
      phone: payload.phone || null,
      symptoms: payload.symptoms || existing.symptoms,
      medicalHistory: payload.medicalHistory || existing.medicalHistory,
      bloodGroup: existing.bloodGroup,
    },
    select: {
      id: true,
      fullName: true,
      age: true,
      gender: true,
      phone: true,
      bloodGroup: true,
      symptoms: true,
      medicalHistory: true,
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

module.exports = { createPatientProfile, getPatientProfile, updatePatientProfile }
