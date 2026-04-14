const Joi = require('joi')
const {
  getAdminStats,
  getAllUsers,
  deleteUser,
  getAllDoctors,
  getPendingDoctors,
  getAllAppointments,
  verifyDoctor,
  rejectDoctor,
} = require('../services/admin.service')

const idSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
})

async function stats(req, res, next) {
  try {
    const data = await getAdminStats()
    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}

async function dashboard(req, res, next) {
  try {
    const [statsData, usersData, doctorsData, pendingDoctorsData, appointmentsData] = await Promise.all([
      getAdminStats(),
      getAllUsers(),
      getAllDoctors(),
      getPendingDoctors(),
      getAllAppointments(),
    ])

    return res.status(200).json({
      stats: statsData,
      users: usersData,
      doctors: doctorsData,
      pendingDoctors: pendingDoctorsData,
      appointments: appointmentsData,
    })
  } catch (err) {
    return next(err)
  }
}

async function users(req, res, next) {
  try {
    const data = await getAllUsers()
    return res.status(200).json({ data })
  } catch (err) {
    return next(err)
  }
}

async function removeUser(req, res, next) {
  try {
    const id = Number(req.params.id)
    const { error } = idSchema.validate({ id })
    if (error) {
      return res.status(400).json({ message: 'Invalid user id' })
    }

    await deleteUser(id)
    return res.status(200).json({ message: 'User deleted successfully' })
  } catch (err) {
    return next(err)
  }
}

async function doctors(req, res, next) {
  try {
    const data = await getAllDoctors()
    return res.status(200).json({ data })
  } catch (err) {
    return next(err)
  }
}

async function pendingDoctors(req, res, next) {
  try {
    const data = await getPendingDoctors()
    return res.status(200).json({ data })
  } catch (err) {
    return next(err)
  }
}

async function verify(req, res, next) {
  try {
    const id = Number(req.params.id)
    const { error } = idSchema.validate({ id })
    if (error) {
      return res.status(400).json({ message: 'Invalid doctor id' })
    }

    const data = await verifyDoctor(id)
    return res.status(200).json({ message: 'Doctor verified successfully', data })
  } catch (err) {
    return next(err)
  }
}

async function reject(req, res, next) {
  try {
    const id = Number(req.params.id)
    const { error } = idSchema.validate({ id })
    if (error) {
      return res.status(400).json({ message: 'Invalid doctor id' })
    }

    const data = await rejectDoctor(id)
    return res.status(200).json({ message: 'Doctor rejected successfully', data })
  } catch (err) {
    return next(err)
  }
}

async function appointments(req, res, next) {
  try {
    const data = await getAllAppointments()
    return res.status(200).json({ data })
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  dashboard,
  stats,
  users,
  removeUser,
  doctors,
  pendingDoctors,
  appointments,
  verify,
  reject,
}
