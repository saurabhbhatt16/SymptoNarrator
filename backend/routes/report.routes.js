const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const requireRole = require('../middlewares/role.middleware')
const { createMyReport, listMyReports } = require('../controllers/report.controller')

const router = express.Router()

router.get('/me', authMiddleware, requireRole('patient'), listMyReports)
router.post('/me', authMiddleware, requireRole('patient'), createMyReport)

module.exports = router
