const Joi = require('joi')
const {
  createAppointment,
  getAvailableDoctors,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
  requestChatForAppointment,
  acceptChatRequest,
  getDoctorChatRequests,
} = require('../services/appointment.service')

const createSchema = Joi.object({
  doctorId: Joi.number().integer().positive().required(),
  date: Joi.date().iso().required(),
  time: Joi.string().trim().required(),
  appointmentType: Joi.string().valid('physical', 'online').required(),
})

const availableDoctorsSchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  time: Joi.string().trim().required(),
})

const statusSchema = Joi.object({
  status: Joi.string().valid('pending', 'accepted', 'rejected', 'completed').required(),
})

const rescheduleSchema = Joi.object({
  date: Joi.date().iso().required(),
})

async function create(req, res, next) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can create appointments' })
    }

    const { error, value } = createSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const appointment = await createAppointment({
      patientId: req.user.id,
      doctorId: value.doctorId,
      date: new Date(value.date),
      time: value.time,
      appointmentType: value.appointmentType || 'physical',
    })

    return res.status(201).json({
      message: 'Appointment created successfully',
      appointment,
    })
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      message: err.message || 'Booking failed',
    })
  }
}

async function book(req, res, next) {
  return create(req, res, next)
}

async function patientList(req, res, next) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can view these appointments' })
    }

    const data = await getPatientAppointments(req.user.id)
    return res.status(200).json({ data })
  } catch (err) {
    return next(err)
  }
}

async function availableDoctors(req, res, next) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can search available doctors' })
    }

    const { error, value } = availableDoctorsSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const doctors = await getAvailableDoctors({
      date: value.date,
      time: value.time,
      patientId: req.user.id,
    })

    return res.status(200).json({ data: doctors })
  } catch (err) {
    return next(err)
  }
}

async function doctorList(req, res, next) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can view these appointments' })
    }

    const data = await getDoctorAppointments(req.user.id)
    return res.status(200).json({ data })
  } catch (err) {
    return next(err)
  }
}

async function doctorAppointments(req, res, next) {
  return doctorList(req, res, next)
}

async function updateStatus(req, res, next) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can update appointment status' })
    }

    const appointmentId = Number(req.params.id)
    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({ message: 'Invalid appointment id' })
    }

    const { error, value } = statusSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const appointment = await updateAppointmentStatus(req.user.id, appointmentId, value.status)
    return res.status(200).json({
      message: 'Appointment status updated successfully',
      appointment,
    })
  } catch (err) {
    return next(err)
  }
}

async function updateStatusByBody(req, res, next) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can update appointment status' })
    }

    const appointmentId = Number(req.body.id)
    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({ message: 'Invalid appointment id' })
    }

    const { error, value } = statusSchema.validate(
      { status: req.body.status },
      { abortEarly: false },
    )
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const appointment = await updateAppointmentStatus(req.user.id, appointmentId, value.status)
    return res.status(200).json({
      message: 'Status updated',
      appointment,
    })
  } catch (err) {
    return next(err)
  }
}

async function reschedule(req, res, next) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can reschedule appointments' })
    }

    const appointmentId = Number(req.params.id)
    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({ message: 'Invalid appointment id' })
    }

    const { error, value } = rescheduleSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details.map((item) => item.message),
      })
    }

    const appointment = await rescheduleAppointment(req.user.id, appointmentId, value.date)
    return res.status(200).json({
      message: 'Appointment rescheduled successfully',
      appointment,
    })
  } catch (err) {
    return next(err)
  }
}

async function remove(req, res, next) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can cancel appointments' })
    }

    const appointmentId = Number(req.params.id)
    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({ message: 'Invalid appointment id' })
    }

    const result = await cancelAppointment(req.user.id, appointmentId)
    return res.status(200).json(result)
  } catch (err) {
    return next(err)
  }
}

async function requestChat(req, res, next) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can request appointment chat' })
    }

    const appointmentId = Number(req.params.id)
    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({ message: 'Invalid appointment id' })
    }

    const appointment = await requestChatForAppointment(req.user.id, appointmentId)
    return res.status(200).json({
      message: 'Chat request sent to doctor',
      appointment,
    })
  } catch (err) {
    return next(err)
  }
}

async function acceptChat(req, res, next) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can accept appointment chat' })
    }

    const appointmentId = Number(req.params.id)
    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({ message: 'Invalid appointment id' })
    }

    const appointment = await acceptChatRequest(req.user.id, appointmentId)
    return res.status(200).json({
      message: 'Chat request accepted',
      appointment,
    })
  } catch (err) {
    return next(err)
  }
}

async function doctorChatRequests(req, res, next) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can view chat requests' })
    }

    const data = await getDoctorChatRequests(req.user.id)
    return res.status(200).json({ data })
  } catch (err) {
    return next(err)
  }
}

module.exports = {
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
}
