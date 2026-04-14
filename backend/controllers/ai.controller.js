const Joi = require('joi')
const prisma = require('../config/prisma')
const {
  generateAiResponse,
  predictSymptoms,
  analyzeSymptoms,
  getSpecialistForDisease,
  getDoctorsBySpecialist,
  generateHealthReportWithDoctors,
} = require('../services/ai.service')
const { createReportForUserId } = require('../services/report.service')

async function saveGeneratedReport({ userId, report }) {
  if (!Number.isInteger(userId) || userId <= 0) {
    return null
  }

  if (!report || typeof report !== 'object') {
    return null
  }

  const saved = await createReportForUserId(userId, report)

  return {
    id: saved?.id || saved?.reportId || null,
    reportId: saved?.reportId || saved?.id || null,
    patientId: saved?.patientId || userId,
    generatedAt: saved?.generatedAt || null,
    createdAt: saved?.createdAt || null,
  }
}

const respondSchema = Joi.object({
  message: Joi.string().trim().min(1).max(2000).required(),
  predictedDisease: Joi.string().trim().max(120).optional(),
  confidence: Joi.number().min(0).max(100).optional(),
})

const predictSchema = Joi.object({
  symptoms: Joi.string().trim().min(2).max(4000).required(),
})

const analyzeSchema = Joi.object({
  symptoms: Joi.string().trim().min(2).max(4000).required(),
  days: Joi.number().min(1).max(365).optional(),
})

async function respond(req, res, next) {
  try {
    const { error, value } = respondSchema.validate(req.body, { abortEarly: false })

    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const result = await generateAiResponse(value)

    return res.status(200).json({
      message: 'AI response generated',
      data: result,
    })
  } catch (err) {
    return next(err)
  }
}

async function predict(req, res, next) {
  try {
    const { error, value } = predictSchema.validate(req.body, { abortEarly: false })

    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const result = await predictSymptoms({ symptoms: value.symptoms })
    return res.status(200).json({ data: result })
  } catch (err) {
    return next(err)
  }
}

/**
 * Analyze symptoms and generate comprehensive health report
 * Also returns matching doctors by specialist
 */
async function analyze(req, res, next) {
  try {
    const { error, value } = analyzeSchema.validate(req.body, { abortEarly: false })

    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    // Get user info from authenticated session and enrich with patient profile demographics.
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: req.user.id },
      select: {
        fullName: true,
        age: true,
        gender: true,
      },
    })

    const userInfo = {
      id: req.user?.id,
      name: patientProfile?.fullName || req.user?.name,
      age: patientProfile?.age ?? req.user?.age,
      gender: patientProfile?.gender || req.user?.gender,
    }

    // Generate report with doctors
    const report = await generateHealthReportWithDoctors({
      symptoms: value.symptoms,
      days: value.days || 1,
      user: userInfo,
    })

    let savedReport = null
    try {
      savedReport = await saveGeneratedReport({
        userId: req.user?.id,
        report,
      })
    } catch (persistError) {
      // Keep API stable even if persistence fails.
      console.error('Report persistence failed:', persistError?.message || persistError)
    }

    return res.status(200).json({
      message: 'Health analysis completed',
      data: report,
      savedReport,
    })
  } catch (err) {
    return next(err)
  }
}

/**
 * Get specialist for a specific disease
 */
async function getSpecialist(req, res, next) {
  try {
    const { diseaseName } = req.params

    if (!diseaseName) {
      return res.status(400).json({
        message: 'Disease name is required',
      })
    }

    const specialist = await getSpecialistForDisease(diseaseName)

    if (!specialist) {
      return res.status(404).json({
        message: 'Disease not found in database',
      })
    }

    return res.status(200).json({
      message: 'Specialist found',
      disease: diseaseName,
      specialist: specialist,
    })
  } catch (err) {
    return next(err)
  }
}

/**
 * Get doctors filtered by specialist
 */
async function getDoctors(req, res, next) {
  try {
    const { specialist } = req.params

    if (!specialist) {
      return res.status(400).json({
        message: 'Specialist name is required',
      })
    }

    const doctors = await getDoctorsBySpecialist(specialist)

    return res.status(200).json({
      message: 'Doctors retrieved',
      specialist: specialist,
      total: doctors.length,
      doctors: doctors,
    })
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  respond,
  predict,
  analyze,
  getSpecialist,
  getDoctors,
}
