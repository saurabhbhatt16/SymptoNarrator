const Joi = require('joi')
const { registerUser, loginUser } = require('../services/auth.service')

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid('patient', 'doctor').required(),
})

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid('patient', 'doctor', 'admin').required(),
})

async function register(req, res, next) {
  try {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const payload = {
      ...value,
      email: value.email.toLowerCase(),
    }

    if (payload.role === 'admin') {
      return res.status(403).json({ message: 'Admin registration is not allowed' })
    }

    const result = await registerUser(payload)
    return res.status(201).json(result)
  } catch (err) {
    return next(err)
  }
}

async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const payload = {
      ...value,
      email: value.email.toLowerCase(),
    }

    const result = await loginUser(payload)
    return res.status(200).json(result)
  } catch (err) {
    return next(err)
  }
}

function me(req, res) {
  return res.status(200).json({ user: req.user })
}

module.exports = {
  register,
  login,
  me,
}
