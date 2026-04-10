import api from './api'

export async function getAdminStatsApi() {
  const response = await api.get('/api/admin/stats')
  return response.data
}

export async function getAdminUsersApi() {
  const response = await api.get('/api/admin/users')
  return response.data
}

export async function getAdminDoctorsApi() {
  const response = await api.get('/api/admin/doctors')
  return response.data
}

export async function getAdminPendingDoctorsApi() {
  const response = await api.get('/api/admin/pending-doctors')
  return response.data
}

export async function getAdminAppointmentsApi() {
  const response = await api.get('/api/admin/appointments')
  return response.data
}

export async function deleteAdminUserApi(id) {
  const response = await api.delete(`/api/admin/user/${id}`)
  return response.data
}

export async function verifyAdminDoctorApi(id) {
  const response = await api.patch(`/api/admin/verify-doctor/${id}`)
  return response.data
}

export async function rejectAdminDoctorApi(id) {
  const response = await api.delete(`/api/admin/doctor/${id}`)
  return response.data
}