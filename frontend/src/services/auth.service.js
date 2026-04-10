import api from './api'

export async function registerApi(payload) {
  const response = await api.post('/api/auth/register', payload)
  return response.data
}

export async function loginApi(payload) {
  const response = await api.post('/api/auth/login', payload)
  return response.data
}

export async function createPatientProfileApi(payload) {
  const response = await api.post('/api/patient/profile', payload)
  return response.data
}

export async function createDoctorProfileApi(payload) {
  const response = await api.post('/api/doctor/profile', payload)
  return response.data
}

export async function completeDoctorProfileApi(payload) {
  const response = await api.patch('/api/doctor/profile', payload)
  return response.data
}

export async function getMeApi() {
  const response = await api.get('/api/auth/me')
  return response.data
}
