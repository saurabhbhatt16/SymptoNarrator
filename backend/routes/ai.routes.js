const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const requireRole = require('../middlewares/role.middleware')
const { respond, predict, analyze, getSpecialist, getDoctors } = require('../controllers/ai.controller')

const router = express.Router()

// Legacy endpoints
router.post('/respond', authMiddleware, requireRole('patient', 'doctor'), respond)
router.post('/predict', authMiddleware, requireRole('patient', 'doctor', 'admin'), predict)

// New ML-powered endpoints
router.post('/analyze', authMiddleware, requireRole('patient'), analyze)
router.get('/specialist/:diseaseName', authMiddleware, getSpecialist)
router.get('/doctors/:specialist', authMiddleware, getDoctors)

module.exports = router
