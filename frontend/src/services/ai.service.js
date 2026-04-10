import api from './api'

export async function getAiResponseApi(payload) {
  const response = await api.post('/api/ai/respond', payload)
  return response.data
}

export async function predictDiseaseApi(payload) {
  const response = await api.post('/api/ai/predict', payload)
  return response.data
}

export async function analyzeSymptomsApi(payload) {
  const response = await api.post('/api/ai/analyze', payload)
  return response.data
}
