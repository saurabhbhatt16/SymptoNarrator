const Joi = require('joi')
const { createMessage, getMessagesByAppointment, getChatContextByAppointment } = require('../services/message.service')

const createMessageSchema = Joi.object({
  appointmentId: Joi.number().integer().positive().required(),
  message: Joi.string().trim().min(1).max(2000).required(),
})

async function getMessages(req, res, next) {
  try {
    const appointmentId = Number(req.params.appointmentId)
    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({ message: 'Invalid appointment id' })
    }

    const [data, context] = await Promise.all([
      getMessagesByAppointment(appointmentId, req.user.id),
      getChatContextByAppointment(appointmentId, req.user.id),
    ])
    return res.status(200).json({ data, context })
  } catch (err) {
    return next(err)
  }
}

async function create(req, res, next) {
  try {
    const { error, value } = createMessageSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const message = await createMessage({
      senderId: req.user.id,
      appointmentId: value.appointmentId,
      message: value.message,
    })

    return res.status(201).json({
      message: 'Message sent successfully',
      data: message,
    })
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  getMessages,
  create,
}
