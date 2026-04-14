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
  try {
    const response = await api.post('/api/patient/profile', payload)
    return response.data
  } catch (error) {
    // If profile already exists, treat setup save as an update.
    if (error?.response?.status === 409) {
      const response = await api.patch('/api/patient/profile', payload)
      return response.data
    }

    throw error
  }
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
