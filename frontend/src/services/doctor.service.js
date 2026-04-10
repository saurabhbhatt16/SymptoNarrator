import api from './api'

export async function getDoctorAvailabilityApi(doctorId) {
  const response = await api.get(`/api/doctors/${doctorId}/availability`)
  return response.data
}

export async function getDoctorProfileApi() {
  const response = await api.get('/api/doctor/me')
  return response.data
}

export async function getDoctorDashboardApi() {
  const response = await api.get('/api/doctor/dashboard')
  return response.data
}

export async function getDoctorTimetableApi() {
  const response = await api.get('/api/doctor/timetable')
  return response.data
}

export async function updateDoctorTimetableApi(payload) {
  const response = await api.patch('/api/doctor/timetable', payload)
  return response.data
}

export async function updateDoctorProfileApi(payload) {
  const response = await api.patch('/api/doctor/me', payload)
  return response.data
}
