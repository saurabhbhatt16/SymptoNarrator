const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const { createProfile, getMyProfile, updateMyProfile, getProfileFlat, updateProfileFlat } = require('../controllers/patient.controller')
const requireRole = require('../middlewares/role.middleware')

const router = express.Router()

router.post('/profile', authMiddleware, createProfile)
router.get('/me', authMiddleware, requireRole('patient'), getMyProfile)
router.patch('/me', authMiddleware, requireRole('patient'), updateMyProfile)
router.get('/profile', authMiddleware, requireRole('patient'), getProfileFlat)
router.patch('/profile', authMiddleware, requireRole('patient'), updateProfileFlat)

module.exports = router
