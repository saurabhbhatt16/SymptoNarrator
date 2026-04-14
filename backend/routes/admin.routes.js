const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const requireRole = require('../middlewares/role.middleware')
const {
  dashboard,
  stats,
  users,
  removeUser,
  doctors,
  pendingDoctors,
  appointments,
  verify,
  reject,
} = require('../controllers/admin.controller')

const router = express.Router()

router.use(authMiddleware, requireRole('admin'))

router.get('/dashboard', dashboard)
router.get('/stats', stats)
router.get('/users', users)
router.get('/pending-doctors', pendingDoctors)
router.get('/appointments', appointments)
router.delete('/user/:id', removeUser)
router.get('/doctors', doctors)
router.patch('/doctor/:id/verify', verify)
router.patch('/verify-doctor/:id', verify)
router.delete('/doctor/:id', reject)

module.exports = router
