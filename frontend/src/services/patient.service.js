import api from './api'

function normalizePatientProfile(payload = {}) {
  if (payload.profile) {
    return payload.profile
  }

  const name = payload.name || payload.fullName || payload.user?.name || ''

  return {
    ...payload,
    fullName: payload.fullName || name,
    name,
    user: payload.user || {
      name,
      email: payload.email || '',
    },
  }
}

export async function getPatientProfileApi() {
  const response = await api.get('/api/patient/profile')
  return normalizePatientProfile(response.data)
}

export async function updatePatientProfileApi(payload) {
  const response = await api.patch('/api/patient/profile', payload)
  return normalizePatientProfile(response.data)
}
