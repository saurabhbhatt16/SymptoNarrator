const Joi = require('joi')
const { createReportForUserId, getReportsByUserId } = require('../services/report.service')

const createReportSchema = Joi.object({
  report: Joi.object({
    patient: Joi.object().optional(),
    form: Joi.object().optional(),
    diagnosis: Joi.object().optional(),
    recovery: Joi.object().optional(),
    treatmentPlan: Joi.array().items(Joi.string().allow('')).optional(),
    medicines: Joi.array().items(Joi.string().allow('')).optional(),
    summary: Joi.string().allow('').optional(),
    generatedAt: Joi.alternatives().try(Joi.string().isoDate(), Joi.date()).optional(),
    date: Joi.string().allow('').optional(),
    time: Joi.string().allow('').optional(),
  })
    .required()
    .unknown(true),
})

async function listMyReports(req, res, next) {
  try {
    const userId = req.user?.id
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const data = await getReportsByUserId(userId)
    return res.status(200).json({ data })
  } catch (err) {
    return next(err)
  }
}

async function createMyReport(req, res, next) {
  try {
    const userId = req.user?.id
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { error, value } = createReportSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: false,
    })

    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const data = await createReportForUserId(userId, value.report)
    return res.status(201).json({ data })
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  listMyReports,
  createMyReport,
}
