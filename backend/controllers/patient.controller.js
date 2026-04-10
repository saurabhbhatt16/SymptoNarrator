const Joi = require('joi')
const { createPatientProfile, getPatientProfile, updatePatientProfile } = require('../services/patient.service')

const patientSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(120).required(),
  age: Joi.number().integer().min(0).max(130).required(),
  gender: Joi.string().trim().min(2).max(30).required(),
  phone: Joi.string().trim().min(7).max(20).allow('', null).optional(),
  bloodGroup: Joi.string().trim().min(2).max(10).required(),
  symptoms: Joi.string().trim().min(2).required(),
  medicalHistory: Joi.string().allow('').optional(),
})

const updatePatientSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  age: Joi.number().integer().min(0).max(130).required(),
  gender: Joi.string().trim().min(2).max(30).required(),
  phone: Joi.string().trim().min(7).max(20).allow('', null).optional(),
  symptoms: Joi.string().trim().min(2).allow('', null).optional(),
  medicalHistory: Joi.string().allow('', null).optional(),
})

function toFlatProfile(profile) {
  return {
    id: profile.id,
    name: profile.user?.name || profile.fullName || '',
    age: profile.age,
    gender: profile.gender,
    email: profile.user?.email || '',
    phone: profile.phone || '',
    bloodGroup: profile.bloodGroup || '',
    symptoms: profile.symptoms || '',
    medicalHistory: profile.medicalHistory || '',
  }
}

async function createProfile(req, res, next) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can create this profile' })
    }

    const { error, value } = patientSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const profile = await createPatientProfile(req.user.id, value)
    return res.status(201).json({
      message: 'Patient profile created',
      profile,
    })
  } catch (err) {
    return next(err)
  }
}

async function getMyProfile(req, res, next) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can access this profile' })
    }

    const profile = await getPatientProfile(req.user.id)
    return res.status(200).json({ profile })
  } catch (err) {
    return next(err)
  }
}

async function getProfileFlat(req, res, next) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can access this profile' })
    }

    const profile = await getPatientProfile(req.user.id)
    return res.status(200).json(toFlatProfile(profile))
  } catch (err) {
    return next(err)
  }
}

async function updateProfileFlat(req, res, next) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can update this profile' })
    }

    const { error, value } = updatePatientSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const profile = await updatePatientProfile(req.user.id, value)
    return res.status(200).json(toFlatProfile(profile))
  } catch (err) {
    return next(err)
  }
}

async function updateMyProfile(req, res, next) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can update this profile' })
    }

    const { error, value } = updatePatientSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const profile = await updatePatientProfile(req.user.id, value)
    return res.status(200).json({ message: 'Patient profile updated', profile })
  } catch (err) {
    return next(err)
  }
}

module.exports = { createProfile, getMyProfile, updateMyProfile, getProfileFlat, updateProfileFlat }
