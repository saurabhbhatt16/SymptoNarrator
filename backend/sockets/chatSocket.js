const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')
const { ensureAppointmentParticipant, createMessage } = require('../services/message.service')

function extractToken(socket) {
  const authToken = socket.handshake.auth?.token
  if (authToken) {
    return authToken.startsWith('Bearer ') ? authToken.split(' ')[1] : authToken
  }

  const headerToken = socket.handshake.headers?.authorization
  if (headerToken && headerToken.startsWith('Bearer ')) {
    return headerToken.split(' ')[1]
  }

  return null
}

function appointmentRoom(appointmentId) {
  return `appointment:${appointmentId}`
}

function initializeChatSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = extractToken(socket)
      if (!token) {
        return next(new Error('Unauthorized'))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true, role: true },
      })

      if (!user) {
        return next(new Error('Unauthorized'))
      }

      socket.user = user
      return next()
    } catch (_error) {
      return next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    socket.on('joinRoom', async (payload, callback) => {
      try {
        const appointmentId = Number(payload?.appointmentId)
        if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
          throw new Error('Invalid appointment id')
        }

        await ensureAppointmentParticipant(appointmentId, socket.user.id)
        socket.join(appointmentRoom(appointmentId))

        if (callback) {
          callback({ ok: true })
        }
      } catch (error) {
        if (callback) {
          callback({ ok: false, message: error.message || 'Unable to join room' })
        }
      }
    })

    socket.on('sendMessage', async (payload, callback) => {
      try {
        const appointmentId = Number(payload?.appointmentId)
        const text = typeof payload?.message === 'string' ? payload.message.trim() : ''

        if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
          throw new Error('Invalid appointment id')
        }

        if (!text) {
          throw new Error('Message cannot be empty')
        }

        const message = await createMessage({
          senderId: socket.user.id,
          appointmentId,
          message: text,
        })

        io.to(appointmentRoom(appointmentId)).emit('newMessage', message)

        if (callback) {
          callback({ ok: true, data: message })
        }
      } catch (error) {
        if (callback) {
          callback({ ok: false, message: error.message || 'Unable to send message' })
        }
      }
    })

    socket.on('disconnect', () => {
      // Socket.io automatically handles room cleanup on disconnect.
    })
  })
}

module.exports = initializeChatSocket
