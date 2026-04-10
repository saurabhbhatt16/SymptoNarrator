const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const requireRole = require('../middlewares/role.middleware')
const { getMessages, create } = require('../controllers/message.controller')

const router = express.Router()

router.get('/:appointmentId', authMiddleware, requireRole('patient', 'doctor'), getMessages)
router.post('/', authMiddleware, requireRole('patient', 'doctor'), create)

module.exports = router
