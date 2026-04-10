const ONE_HOUR_IN_MS = 60 * 60 * 1000

export function getAppointmentTimestamp(appointment) {
  const timestamp = new Date(appointment?.date).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

export function getAppointmentWindowEnd(appointment) {
  const timestamp = getAppointmentTimestamp(appointment)
  return timestamp ? timestamp + ONE_HOUR_IN_MS : null
}

export function isAppointmentVideoActive(appointment, now = Date.now()) {
  const startTime = getAppointmentTimestamp(appointment)
  const endTime = getAppointmentWindowEnd(appointment)

  if (startTime === null || endTime === null) {
    return false
  }

  return appointment?.status === 'accepted' && now >= startTime && now < endTime
}

export function isAppointmentUpcomingForView(appointment, now = Date.now()) {
  const endTime = getAppointmentWindowEnd(appointment)

  if (endTime === null) {
    return false
  }

  if (appointment?.status === 'pending') {
    return true
  }

  return appointment?.status === 'accepted' && now < endTime
}

export function isAppointmentCompletedForView(appointment, now = Date.now()) {
  const endTime = getAppointmentWindowEnd(appointment)

  if (endTime === null) {
    return appointment?.status === 'completed'
  }

  if (appointment?.status === 'completed') {
    return true
  }

  return appointment?.status === 'accepted' && now >= endTime
}
