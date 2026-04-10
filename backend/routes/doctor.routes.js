const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const requireRole = require('../middlewares/role.middleware')
const {
	createProfile,
	completeProfile,
	getDoctors,
	getDoctor,
	getDoctorAvailability,
	getMyProfile,
	getDashboard,
	getMyTimetable,
	updateMyTimetable,
	updateMyProfile,
} = require('../controllers/doctor.controller')

const router = express.Router()

router.get('/dashboard', authMiddleware, requireRole('doctor'), getDashboard)
router.get('/me', authMiddleware, requireRole('doctor'), getMyProfile)
router.get('/timetable', authMiddleware, requireRole('doctor'), getMyTimetable)
router.patch('/timetable', authMiddleware, requireRole('doctor'), updateMyTimetable)
router.patch('/me', authMiddleware, requireRole('doctor'), updateMyProfile)
router.patch('/profile', authMiddleware, requireRole('doctor'), completeProfile)
router.get('/', getDoctors)
router.get('/:id/availability', getDoctorAvailability)
router.get('/:id', getDoctor)
router.post('/profile', authMiddleware, requireRole('doctor'), createProfile)

module.exports = router
