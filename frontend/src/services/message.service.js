import api from './api'

export async function getMessagesApi(appointmentId) {
  const response = await api.get(`/api/messages/${appointmentId}`)
  return response.data
}

export async function sendMessageApi(payload) {
  const response = await api.post('/api/messages', payload)
  return response.data
}
