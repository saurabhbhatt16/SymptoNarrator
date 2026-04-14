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
      profileImage: payload.profileImage || null,
      bloodGroup: payload.bloodGroup,
      symptoms: payload.symptoms || null,
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
      profileImage: true,
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

  const nextName = payload.name && String(payload.name).trim() ? String(payload.name).trim() : existing.fullName
  const hasNameChange = Boolean(nextName) && nextName !== existing.fullName

  if (hasNameChange) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: nextName },
    })
  }

  const nextAge = Number.isInteger(payload.age) ? payload.age : existing.age
  const nextGender = payload.gender && String(payload.gender).trim() ? String(payload.gender).trim() : existing.gender
  const nextPhone = payload.phone == null ? existing.phone : payload.phone || null
  const nextBloodGroup =
    payload.bloodGroup == null
      ? existing.bloodGroup
      : String(payload.bloodGroup).trim() || existing.bloodGroup
  const nextSymptoms = payload.symptoms == null ? existing.symptoms : payload.symptoms || existing.symptoms
  const nextMedicalHistory = payload.medicalHistory == null ? existing.medicalHistory : payload.medicalHistory || null
  const nextProfileImage = payload.profileImage == null ? existing.profileImage : payload.profileImage || null

  const profile = await prisma.patientProfile.update({
    where: { userId },
    data: {
      fullName: nextName,
      age: nextAge,
      gender: nextGender,
      phone: nextPhone,
      profileImage: nextProfileImage,
      bloodGroup: nextBloodGroup,
      symptoms: nextSymptoms,
      medicalHistory: nextMedicalHistory,
    },
    select: {
      id: true,
      fullName: true,
      age: true,
      gender: true,
      phone: true,
      profileImage: true,
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
