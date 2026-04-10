const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const requireRole = require('../middlewares/role.middleware')
const {
  create,
  book,
  availableDoctors,
  patientList,
  doctorList,
  doctorAppointments,
  updateStatus,
  updateStatusByBody,
  reschedule,
  remove,
  requestChat,
  acceptChat,
  doctorChatRequests,
} = require('../controllers/appointment.controller')

const router = express.Router()

router.post('/', authMiddleware, requireRole('patient'), create)
router.post('/book', authMiddleware, requireRole('patient'), book)
router.post('/available-doctors', authMiddleware, requireRole('patient'), availableDoctors)
router.get('/patient', authMiddleware, requireRole('patient'), patientList)
router.get('/doctor', authMiddleware, requireRole('doctor'), doctorList)
router.get('/doctor-appointments', authMiddleware, requireRole('doctor'), doctorAppointments)
router.patch('/:id/status', authMiddleware, requireRole('doctor'), updateStatus)
router.patch('/update-status', authMiddleware, requireRole('doctor'), updateStatusByBody)
router.post('/:id/chat-request', authMiddleware, requireRole('patient'), requestChat)
router.patch('/:id/chat-request/accept', authMiddleware, requireRole('doctor'), acceptChat)
router.get('/doctor/chat-requests', authMiddleware, requireRole('doctor'), doctorChatRequests)
router.patch('/:id/reschedule', authMiddleware, requireRole('patient'), reschedule)
router.delete('/:id', authMiddleware, requireRole('patient'), remove)

module.exports = router
