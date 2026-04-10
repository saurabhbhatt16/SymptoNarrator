import api from './api'

export async function createAppointmentApi(payload) {
  const response = await api.post('/api/appointments/book', payload)
  window.dispatchEvent(new Event('appointments-updated'))
  return response.data
}

export async function searchAvailableDoctorsApi(payload) {
  const response = await api.post('/api/appointments/available-doctors', payload)
  return response.data
}

export async function getPatientAppointmentsApi() {
  const response = await api.get('/api/appointments/patient')
  return response.data
}

export async function getDoctorAppointmentsApi() {
  const response = await api.get('/api/doctor/appointments')
  return response.data
}

export async function updateAppointmentStatusApi(id, status) {
  const response = await api.patch(`/api/appointments/${id}/status`, { status })
  window.dispatchEvent(new Event('appointments-updated'))
  return response.data
}

export async function cancelAppointmentApi(id) {
  const response = await api.delete(`/api/appointments/${id}`)
  window.dispatchEvent(new Event('appointments-updated'))
  return response.data
}

export async function rescheduleAppointmentApi(id, date) {
  const response = await api.patch(`/api/appointments/${id}/reschedule`, { date })
  window.dispatchEvent(new Event('appointments-updated'))
  return response.data
}

export async function requestAppointmentChatApi(id) {
  const response = await api.post(`/api/appointments/${id}/chat-request`)
  window.dispatchEvent(new Event('appointments-updated'))
  return response.data
}

export async function acceptAppointmentChatApi(id) {
  const response = await api.patch(`/api/appointments/${id}/chat-request/accept`)
  window.dispatchEvent(new Event('appointments-updated'))
  return response.data
}

export async function getDoctorChatRequestsApi() {
  const response = await api.get('/api/appointments/doctor/chat-requests')
  return response.data
}
